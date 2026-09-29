"""
TensorFlow Lite export for on-device / offline screening.

The web app and any future mobile client need inference without a server
(rural clinics, intermittent connectivity).  This module converts the trained
Keras model to TFLite, verifies that the converted model still agrees with Keras
on real images, and records the metadata a client needs to use it correctly.

    python -m ml.src.deploy                   # float16 (default): ~2x smaller
    python -m ml.src.deploy --mode int8       # full integer: ~4x smaller
    python -m ml.src.deploy --mode float32

Input contract
--------------
The exported model keeps the pipeline's input contract — RGB images scaled to
[0, 255] — because the EfficientNet Rescaling/Normalization layers are part of
the graph.  ``int8`` models take ``uint8`` input directly (decode the JPEG and
pass the raw bytes), so the client needs no preprocessing at all.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Iterator, List

# Ensure this directory (src/) is on sys.path so `import config` works whether
# the module is imported as a package or executed as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np

import config
import runtime                      # exports the TF thread env vars

runtime.configure()

import tensorflow as tf             # noqa: E402  (after runtime.configure)
from PIL import Image               # noqa: E402

import model as model_lib           # noqa: E402
import preprocessing                # noqa: E402
from config import (                # noqa: E402
    ARTIFACTS_DIR, BEST_MODEL_PATH, CLASS_NAMES, DISCLAIMER, IMAGE_DIR,
    IMAGE_SIZE, LABEL_MAP_PATH, SEED, TFLITE_PATH,
)


# ===========================================================================
# 1. Calibration / verification data
# ===========================================================================

def load_uint8_images(n: int = 120, split: str = "val",
                      seed: int = SEED) -> np.ndarray:
    """Load *n* dataset images as ``uint8`` RGB arrays in [0, 255]."""
    train_df, val_df, test_df = preprocessing.load_manifests()
    frames = {"train": train_df, "val": val_df, "test": test_df}
    df = frames[split].sample(n=min(n, len(frames[split])), random_state=seed)

    images: List[np.ndarray] = []
    for image_id in df["image_id"]:
        path = Path(IMAGE_DIR) / f"{image_id}.jpg"
        with Image.open(path) as im:
            rgb = im.convert("RGB").resize((IMAGE_SIZE[1], IMAGE_SIZE[0]),
                                            Image.LANCZOS)
        images.append(np.asarray(rgb, dtype="uint8"))
    return np.stack(images)


def representative_dataset(n: int = 120) -> Iterator[List[np.ndarray]]:
    """Calibration generator for full-integer quantisation (uint8 batches)."""
    images = load_uint8_images(n=n)
    for i in range(len(images)):
        yield [images[i:i + 1]]


# ===========================================================================
# 2. Conversion
# ===========================================================================

def convert_to_tflite(
    model_path: Path = BEST_MODEL_PATH,
    mode: str = "float16",
    out_path: Path = TFLITE_PATH,
    calibration_images: int = 120,
) -> Dict:
    """Convert the Keras model to TFLite and write it to *out_path*."""
    model_path = Path(model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    print(f"[Deploy] Loading {model_path}")
    model = model_lib.load_trained_model(model_path, compile_model_flag=False)

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    mode = mode.lower()

    if mode == "float32":
        pass                                     # exact conversion
    elif mode == "float16":
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
    elif mode == "int8":
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.representative_dataset = lambda: representative_dataset(calibration_images)
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.uint8      # raw [0, 255] pixels
        converter.inference_output_type = tf.float32   # keep softmax probabilities
    else:
        raise ValueError("mode must be one of: float32 | float16 | int8")

    print(f"[Deploy] Converting ({mode}) ...")
    tflite_bytes = converter.convert()

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as fh:
        fh.write(tflite_bytes)
    print(f"[Deploy] Wrote {out_path} ({len(tflite_bytes) / 1024:.0f} KB)")
    return {"path": str(out_path), "mode": mode, "bytes": len(tflite_bytes)}


# ===========================================================================
# 3. Verification against the Keras model
# ===========================================================================

def verify_tflite(
    tflite_path: Path = TFLITE_PATH,
    model_path: Path = BEST_MODEL_PATH,
    n_samples: int = 64,
) -> Dict:
    """Compare TFLite predictions with Keras predictions on real images.

    Quantisation is only acceptable if the exported model still agrees with the
    model that was validated, so this acts as a gate: ``argmax_agreement`` should
    be 1.0 (or very close) before the artefact is shipped.
    """
    images = load_uint8_images(n=n_samples, split="val")
    keras_model = model_lib.load_trained_model(model_path, compile_model_flag=False)
    keras_probs = keras_model.predict(images.astype("float32"), batch_size=16,
                                      verbose=0)

    interpreter = tf.lite.Interpreter(model_path=str(tflite_path))
    interpreter.allocate_tensors()
    input_detail = interpreter.get_input_details()[0]
    output_detail = interpreter.get_output_details()[0]

    tflite_probs: List[np.ndarray] = []
    for img in images:
        data = img[None, ...] if input_detail["dtype"] == np.uint8 \
            else img.astype("float32")[None, ...]
        interpreter.set_tensor(input_detail["index"], data)
        interpreter.invoke()
        tflite_probs.append(interpreter.get_tensor(output_detail["index"])[0])
    tflite_probs = np.asarray(tflite_probs, dtype=np.float32)
    if output_detail["dtype"] == np.uint8:
        tflite_probs = tflite_probs / 255.0

    diff = np.abs(keras_probs - tflite_probs)
    verification = {
        "n_samples": int(len(images)),
        "mean_abs_probability_difference": float(diff.mean()),
        "max_abs_probability_difference": float(diff.max()),
        "argmax_agreement": float(np.mean(np.argmax(keras_probs, axis=1)
                                         == np.argmax(tflite_probs, axis=1))),
        "input": {"dtype": str(np.dtype(input_detail["dtype"])),
                  "shape": [int(x) for x in input_detail["shape"]]},
        "output": {"dtype": str(np.dtype(output_detail["dtype"])),
                   "shape": [int(x) for x in output_detail["shape"]]},
    }
    print(f"[Deploy] Verification: argmax agreement "
          f"{verification['argmax_agreement'] * 100:.1f}%, max |dP| "
          f"{verification['max_abs_probability_difference']:.4f}")
    return verification


# ===========================================================================
# 4. Metadata + CLI
# ===========================================================================

def write_metadata(
    conversion: Dict,
    verification: Dict | None,
    out_path: Path = ARTIFACTS_DIR / "tflite_metadata.json",
    model_path: Path = BEST_MODEL_PATH,
) -> Dict:
    """Write everything a client needs to run the exported model correctly."""
    label_map = model_lib.load_label_map(LABEL_MAP_PATH) \
        if Path(LABEL_MAP_PATH).exists() else {"index_to_class": {}}

    metadata = {
        "artifact": conversion["path"],
        "size_kb": round(conversion["bytes"] / 1024, 1),
        "quantisation": conversion["mode"],
        "source_model": str(model_path),
        "input_contract": {
            "description": ("RGB image resized to IMAGE_SIZE. Float models expect "
                            "values scaled to [0, 255]; int8 models take uint8 "
                            "[0, 255] directly."),
            "image_size": list(IMAGE_SIZE),
            "input_range": list(config.MODEL_INPUT_RANGE),
        },
        "index_to_class": {str(k): v for k, v in
                           label_map.get("index_to_class", {}).items()},
        "class_descriptions": label_map.get("class_descriptions", {}),
        "high_recall_classes": label_map.get("high_recall_classes", []),
        "verification": verification,
        "usage_example": (
            "import tensorflow as tf\n"
            "interp = tf.lite.Interpreter('mediminds_skin_sense.tflite')\n"
            "interp.allocate_tensors()\n"
            "inp, out = interp.get_input_details()[0], interp.get_output_details()[0]\n"
            "interp.set_tensor(inp['index'], image_uint8_or_scaled_float[None])\n"
            "interp.invoke()\n"
            "probs = interp.get_tensor(out['index'])[0]  # softmax over 7 classes"
        ),
        "interpretation_notes": (
            "Probabilities are model confidences, not clinical certainties. The "
            "predicted class must always be reviewed by a qualified clinician "
            "together with the Grad-CAM heat-map."
        ),
        "disclaimer": DISCLAIMER,
    }
    out_path = Path(out_path)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2, default=str)
    print(f"[Deploy] Metadata written to {out_path}")
    return metadata


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export the model to TFLite.")
    parser.add_argument("--model", default=str(BEST_MODEL_PATH))
    parser.add_argument("--mode", default="float16",
                        choices=["float32", "float16", "int8"])
    parser.add_argument("--out", default=str(TFLITE_PATH))
    parser.add_argument("--calibration-samples", type=int, default=120)
    parser.add_argument("--verify-samples", type=int, default=64)
    parser.add_argument("--no-verify", dest="verify", action="store_false",
                        help="Skip the Keras-vs-TFLite comparison.")
    return parser.parse_args(argv)


def main(argv=None) -> Dict:
    args = parse_args(argv)
    tf.keras.utils.set_random_seed(SEED)

    print("=" * 72)
    print("  MediMinds Skin Sense - TFLite export")
    print("=" * 72)
    conversion = convert_to_tflite(model_path=Path(args.model), mode=args.mode,
                                   out_path=Path(args.out),
                                   calibration_images=args.calibration_samples)
    verification = None
    if args.verify:
        verification = verify_tflite(Path(conversion["path"]), Path(args.model),
                                    n_samples=args.verify_samples)
    metadata = write_metadata(conversion, verification, model_path=Path(args.model))

    print("\nExport summary")
    print(f"  file      : {conversion['path']}")
    print(f"  size      : {conversion['bytes'] / 1024:.0f} KB ({args.mode})")
    if verification:
        print(f"  agreement : {verification['argmax_agreement'] * 100:.1f}% "
              "with the Keras model")
    print(f"\n{DISCLAIMER}")
    print("=" * 72)
    return metadata


if __name__ == "__main__":
    main()
