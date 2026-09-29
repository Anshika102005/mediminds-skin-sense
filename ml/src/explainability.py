"""
Grad-CAM explainability for the MediMinds Skin Sense classifier.

Why it matters
--------------
A dermatology screening model must be inspectable: a clinician (or a reviewer)
needs to see *which pixels* drove a prediction.  Grad-CAM (Selvaraju et al.,
2017) weights the deepest convolutional feature map by the gradient of the
predicted class score, producing a coarse localisation heat-map.

Implementation notes
--------------------
* The gradient is taken w.r.t. ``top_activation`` (EfficientNetB0's last 4-D
  layer).  ``model.find_last_conv_layer()`` locates it automatically.
* The model expects raw **[0, 255]** pixels (its own Rescaling/Normalization
  layers are inside the graph), so the same tensors the classifier sees are
  passed to the gradient model — no double normalisation.
* Heat-maps are up-sampled to the display image with bilinear interpolation and
  re-scaled to [0, 1]; the overlay is JET-coloured at 45 % opacity.

Usage
-----
    python -m ml.src.explainability                 # 24 test images
    python -m ml.src.explainability --split val --n 12
    python -m ml.src.explainability --image C:\\path\\lesion.jpg
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

# Ensure this directory (src/) is on sys.path so `import config` works whether
# the module is imported as a package or executed as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import cv2
import numpy as np

import config
import runtime                      # exports the TF thread env vars

runtime.configure()

import tensorflow as tf             # noqa: E402  (after runtime.configure)
from PIL import Image               # noqa: E402

import model as model_lib           # noqa: E402
from config import (                # noqa: E402
    ARTIFACTS_DIR, BEST_MODEL_PATH, CLASS_NAMES, DISCLAIMER, GRADCAM_DIR,
    IMAGE_DIR, IMAGE_SIZE, SEED,
)
from plots import plot_sample_grid  # noqa: E402


# ===========================================================================
# 1. Image helpers
# ===========================================================================

def load_display_image(path: str | Path,
                       size: Tuple[int, int] = IMAGE_SIZE) -> np.ndarray:
    """Load an image for display as float32 RGB in [0, 1] (LANCZOS resized)."""
    with Image.open(path) as im:
        rgb = im.convert("RGB").resize((int(size[1]), int(size[0])), Image.LANCZOS)
    return np.asarray(rgb, dtype="float32") / 255.0


def model_input_from_display(display01: np.ndarray) -> tf.Tensor:
    """Convert a [0, 1] display image into the model's [0, 255] input batch."""
    lo, hi = config.MODEL_INPUT_RANGE
    batch = np.expand_dims(display01, axis=0)
    scaled = batch * (hi - lo) + lo
    return tf.convert_to_tensor(scaled, dtype=tf.float32)


# ===========================================================================
# 2. Grad-CAM
# ===========================================================================

def make_gradcam_model(model: tf.keras.Model) -> tf.keras.Model:
    """Build a model returning ``(last_conv_feature_map, predictions)``."""
    layer_name = model_lib.find_last_conv_layer(model)
    last_conv = model_lib.get_backbone(model).get_layer(layer_name)
    return tf.keras.Model(model.inputs, [last_conv.output, model.output],
                          name="gradcam_model")


def compute_gradcam(
    gradcam_model: tf.keras.Model,
    input_batch: tf.Tensor,
    class_index: Optional[int] = None,
) -> Tuple[np.ndarray, np.ndarray, int]:
    """Return ``(heatmap [0,1] float32, probabilities, class_index)``.

    If ``class_index`` is None the predicted (arg-max) class is explained.
    """
    with tf.GradientTape(persistent=False) as tape:
        conv_outputs, predictions = gradcam_model(input_batch, training=False)
        if class_index is None:
            class_index = int(tf.argmax(predictions[0]))
        class_score = predictions[:, class_index]

    grads = tape.gradient(class_score, conv_outputs)
    if grads is None:                                  # pragma: no cover
        raise RuntimeError("Grad-CAM: no gradient w.r.t. the target layer.")

    # Global-average-pool the gradients over the spatial dimensions
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2)).numpy()
    conv = conv_outputs[0].numpy()

    heatmap = np.tensordot(conv, pooled_grads, axes=([-1], [0]))
    heatmap = np.maximum(heatmap, 0.0)                 # ReLU
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    heatmap = tf.image.resize(heatmap[..., np.newaxis], IMAGE_SIZE,
                              method="bilinear").numpy()[..., 0]
    return heatmap.astype("float32"), predictions.numpy()[0], int(class_index)


def overlay_heatmap(display01: np.ndarray, heatmap: np.ndarray,
                    alpha: float = 0.45) -> np.ndarray:
    """Blend a JET-coloured heat-map over the image (input/output in [0, 1] RGB)."""
    base = np.clip(display01, 0.0, 1.0)
    heat_uint8 = np.uint8(np.clip(heatmap, 0.0, 1.0) * 255)
    colour = cv2.applyColorMap(heat_uint8, cv2.COLORMAP_JET)   # BGR
    colour = cv2.cvtColor(colour, cv2.COLOR_BGR2RGB).astype("float32") / 255.0
    return np.clip((1.0 - alpha) * base + alpha * colour, 0.0, 1.0)


def explain_image(
    model: tf.keras.Model,
    gradcam_model: tf.keras.Model,
    image_path: str | Path,
    class_index: Optional[int] = None,
) -> Dict:
    """Explain a single image: heat-map, overlay and prediction metadata."""
    display = load_display_image(image_path)
    heatmap, probs, explained_class = compute_gradcam(
        gradcam_model, model_input_from_display(display), class_index
    )
    predicted = int(np.argmax(probs))
    peak_y, peak_x = np.unravel_index(int(np.argmax(heatmap)), heatmap.shape)

    return {
        "path": str(image_path),
        "image_id": Path(image_path).stem,
        "display": display,
        "heatmap": heatmap,
        "overlay": overlay_heatmap(display, heatmap),
        "probabilities": {CLASS_NAMES[i]: float(p) for i, p in enumerate(probs)},
        "predicted_class": CLASS_NAMES[predicted],
        "predicted_index": predicted,
        "confidence": float(probs[predicted]),
        "explained_class": CLASS_NAMES[explained_class],
        "heatmap_peak_xy": [int(peak_x), int(peak_y)],
    }


def explain_split(
    model: tf.keras.Model,
    split: str = "test",
    n: int = 24,
    out_dir: Path = GRADCAM_DIR,
    seed: int = SEED,
) -> Dict:
    """Explain *n* images from a split, prioritising misclassified examples.

    Misclassified cases are where an explainability check earns its keep: the
    heat-map shows what the model latched onto instead of the lesion.
    """
    import pandas as pd
    from config import DATA_DIR

    df = pd.read_csv(DATA_DIR / f"{split}_manifest.csv")
    gradcam_model = make_gradcam_model(model)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Cheap first pass over a random pool so we can find mistakes to explain.
    pool = df.sample(n=min(len(df), max(n * 12, 240)), random_state=seed)
    pool_display, pool_labels, pool_ids = [], [], []
    for _, row in pool.iterrows():
        path = os.path.join(str(IMAGE_DIR), f"{row['image_id']}.jpg")
        pool_display.append(load_display_image(path))
        pool_labels.append(int(row["label"]))
        pool_ids.append(row["image_id"])

    lo, hi = config.MODEL_INPUT_RANGE
    pool_inputs = tf.convert_to_tensor(np.stack(pool_display) * (hi - lo) + lo,
                                       dtype=tf.float32)
    pool_probs = model.predict(pool_inputs, batch_size=16, verbose=0)
    pool_pred = np.argmax(pool_probs, axis=1)
    pool_labels = np.asarray(pool_labels)

    correct_idx = np.flatnonzero(pool_pred == pool_labels)
    wrong_idx = np.flatnonzero(pool_pred != pool_labels)
    half = max(1, n // 2)
    n_wrong = min(half, len(wrong_idx))
    picks = []
    if n_wrong:
        picks.append(np.random.default_rng(seed).choice(wrong_idx, size=n_wrong,
                                                       replace=False))
    picks.append(np.random.default_rng(seed + 1).choice(
        correct_idx, size=min(n - n_wrong, len(correct_idx)), replace=False))
    chosen = np.concatenate(picks)

    examples: List[Dict] = []
    for idx in chosen:
        image_id = pool_ids[int(idx)]
        path = os.path.join(str(IMAGE_DIR), f"{image_id}.jpg")
        info = explain_image(model, gradcam_model, path)
        true_name = CLASS_NAMES[int(pool_labels[int(idx)])]
        info["true_class"] = true_name
        info["correct"] = bool(info["predicted_class"] == true_name)

        plot_sample_grid(
            [info["display"], info["heatmap"], info["overlay"]],
            ["input", "Grad-CAM", f"pred={info['predicted_class']} "
                                  f"({info['confidence']:.2f})",
             ][:3],
            out_dir / f"{image_id}_gradcam.png", ncols=3, figsize_per_cell=2.6,
            suptitle=f"true={true_name} | "
                     f"{'correct' if info['correct'] else 'MISCLASSIFIED'}",
        )
        examples.append({k: v for k, v in info.items()
                         if k not in ("display", "heatmap", "overlay")})
        print(f"[Grad-CAM] {image_id}: pred={info['predicted_class']} "
              f"({info['confidence']:.2f}) true={true_name} "
              f"{'OK' if info['correct'] else 'MISS'}")

    wrong_examples = [e for e in examples if not e["correct"]]
    right_examples = [e for e in examples if e["correct"]]
    for filename, subset, title in (
        ("gradcam_correct.png", right_examples, "Correctly classified"),
        ("gradcam_misclassified.png", wrong_examples, "Misclassified (inspect why)"),
    ):
        if not subset:
            continue
        overlays = [explain_image(model, gradcam_model, e["path"])["overlay"]
                    for e in subset[:12]]
        captions = [f"pred={e['predicted_class']}\ntrue={e['true_class']}"
                    for e in subset[:12]]
        plot_sample_grid(overlays, captions, out_dir / filename, ncols=4,
                         suptitle=f"{title} - Grad-CAM overlays ({split} split)")

    summary = {
        "split": split,
        "gradcam_layer": model_lib.find_last_conv_layer(model),
        "pool_size": int(len(pool)),
        "pool_accuracy": float(np.mean(pool_pred == pool_labels)),
        "n_explained": len(examples),
        "n_correct": len(right_examples),
        "n_misclassified": len(wrong_examples),
        "examples": examples,
        "disclaimer": DISCLAIMER,
    }
    summary_path = out_dir / f"gradcam_summary_{split}.json"
    with open(summary_path, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2, default=str)
    print(f"\n[Grad-CAM] Summary written to {summary_path}")
    return summary


# ===========================================================================
# 3. CLI
# ===========================================================================

def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Grad-CAM explanations for MediMinds Skin Sense predictions."
    )
    parser.add_argument("--model", default=str(BEST_MODEL_PATH))
    parser.add_argument("--split", default="test",
                        choices=["train", "val", "test"])
    parser.add_argument("--n", type=int, default=24,
                        help="How many images to explain.")
    parser.add_argument("--image", default=None,
                        help="Explain a single image file instead of a split.")
    parser.add_argument("--out-dir", default=str(GRADCAM_DIR))
    return parser.parse_args(argv)


def main(argv=None) -> Dict:
    args = parse_args(argv)
    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    print("=" * 72)
    print("  MediMinds Skin Sense - Grad-CAM explainability")
    print("=" * 72)
    model = model_lib.load_trained_model(model_path, compile_model_flag=False)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.image:
        gradcam_model = make_gradcam_model(model)
        info = explain_image(model, gradcam_model, args.image)
        plot_sample_grid(
            [info["display"], info["heatmap"], info["overlay"]],
            ["input", "Grad-CAM", f"pred={info['predicted_class']} "
                                  f"({info['confidence']:.2f})"],
            out_dir / f"{info['image_id']}_gradcam.png", ncols=3,
            figsize_per_cell=2.8, suptitle=f"Grad-CAM for {info['image_id']}",
        )
        print(f"\nPrediction : {info['predicted_class']} "
              f"({info['confidence'] * 100:.1f}% confidence)")
        print("Class probabilities:")
        for name, prob in sorted(info["probabilities"].items(),
                                 key=lambda kv: -kv[1]):
            print(f"  {name:>6}: {prob * 100:5.1f}%")
        print(f"\n{config.DISCLAIMER}")
        print("=" * 72)
        return info

    summary = explain_split(model, split=args.split, n=args.n, out_dir=out_dir)
    print(f"\nExplained {summary['n_explained']} images "
          f"({summary['n_misclassified']} misclassified) - figures in {out_dir}")
    print(f"\n{config.DISCLAIMER}")
    print("=" * 72)
    return summary


if __name__ == "__main__":
    main()


