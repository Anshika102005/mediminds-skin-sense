"""
Preprocessing, cleaning and augmentation for the HAM10000 skin-lesion pipeline.

Key design principles
---------------------
* **Data leakage prevention** — every image of a given `lesion_id` belongs to
  exactly one split.  Augmentation is applied on-the-fly *only* to the
  training set; validation and test pipelines never augment.
* **No silent deletions** — the cleaning function logs every file it
  quarantines and *why*, then the caller decides what to do.
* **Medical realism** — augmentations are mild and preserve anatomical
  plausibility (lesion shape, colour, and texture are not distorted beyond
  realistic variation).
* **CPU-first** — on a machine with no GPU the pipeline runs on CPU.

Typical usage (from a training script)::

    from src.preprocessing import build_datasets, get_class_weights

    train_ds, val_ds, test_ds, metadata = build_datasets()
    class_w = get_class_weights(metadata["train_df"])
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Dict, Tuple

# Ensure this directory (src/) is on sys.path so `import config` works
# whether the file is run as a script or imported as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import pandas as pd
import tensorflow as tf
from PIL import Image
from sklearn.utils.class_weight import compute_class_weight

import config
from config import (
    ARTIFACTS_DIR, AUG_BRIGHTNESS, AUG_CONTRAST, AUG_ROTATION, AUG_TRANSLATION,
    AUG_ZOOM, BATCH_SIZE, CLASS_NAMES, DATA_DIR, DATA_NUM_PARALLEL_CALLS,
    IMAGE_DIR, IMAGE_SIZE, MODEL_INPUT_RANGE, SEED,
)

#: tf.data ``map`` parallelism — see ``config.DATA_NUM_PARALLEL_CALLS`` for why
#: this is a small fixed number instead of ``tf.data.AUTOTUNE`` on CPU.
PARALLEL = DATA_NUM_PARALLEL_CALLS


# ===========================================================================
# 1. Image validation / cleaning
# ===========================================================================

def _validate_one(filepath: str, target_size: Tuple[int, int] = IMAGE_SIZE) -> dict:
    """Check a single image file for integrity and loadability.

    Returns a dict with keys: valid, width, height, mode, error, path.
    """
    result = {"valid": False, "width": 0, "height": 0, "mode": "",
              "error": "", "path": filepath}
    try:
        with Image.open(filepath) as im:
            im.verify()
        with Image.open(filepath) as im:
            w, h = im.size
            result.update(valid=True, width=w, height=h, mode=im.mode)
    except Exception as exc:                       # noqa: BLE001
        result["error"] = str(exc)
    return result


def clean_image_folder(
    image_dir: str = str(IMAGE_DIR),
    manifest_csv: str = str(DATA_DIR / "train_manifest.csv"),
) -> dict:
    """Validate every image referenced by *manifest_csv* and write a report.

    Files that fail validation are **not deleted** — they are listed in the
    returned report so the caller can review them.  A `quarantined.json`
    file is written to ``artifacts/``.

    Returns a summary dict.
    """
    from tqdm import tqdm  # optional, imported lazily
    try:
        import tqdm
    except ImportError:
        tqdm = None

    df = pd.read_csv(manifest_csv)
    report = {"total": 0, "valid": 0, "corrupted": [], "unexpected_size": []}

    iterator = df["image_id"].tolist()
    if tqdm:
        iterator = tqdm(iterator, desc="Validating images")

    for img_id in iterator:
        fname = f"{img_id}.jpg"
        fpath = os.path.join(image_dir, fname)
        report["total"] += 1
        res = _validate_one(fpath)
        if res["valid"]:
            report["valid"] += 1
            if (res["width"], res["height"]) != IMAGE_SIZE:
                report["unexpected_size"].append({
                    "file": fname, "w": res["width"], "h": res["height"],
                })
        else:
            report["corrupted"].append({
                "file": fname, "error": res["error"], "image_id": img_id,
            })

    report_path = ARTIFACTS_DIR / "quarantine_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\n[Cleaning] Validated {report['total']} images")
    print(f"[Cleaning] Valid: {report['valid']}")
    print(f"[Cleaning] Corrupted / unreadable: {len(report['corrupted'])}")
    print(f"[Cleaning] Unexpected size (will be resized): {len(report['unexpected_size'])}")
    if report["corrupted"]:
        print(f"[Cleaning] Quarantine report: {report_path}")
    return report


# ===========================================================================
# 2. Keras preprocessing pipeline (resize + normalise)
# ===========================================================================

def _make_resize_layer(antialias: bool = True) -> tf.keras.layers.Resizing:
    """Resize images to the model input size (``config.IMAGE_SIZE``).

    Applied to *every* split (train, val, test) so the model always receives a
    consistent spatial shape.  ``antialias=True`` matters here: source images are
    600x450 and are down-sampled to 224x224, and naive bilinear down-sampling
    aliases the fine dermoscopic texture the model needs.
    """
    return tf.keras.layers.Resizing(
        IMAGE_SIZE[0], IMAGE_SIZE[1], interpolation="bilinear", antialias=antialias
    )


def _make_model_input_layer() -> tf.keras.layers.Rescaling:
    """Map [0, 1] pixels onto ``config.MODEL_INPUT_RANGE``.

    Expressed as ``scale = hi - lo`` / ``offset = lo`` so the same code is
    correct for any backbone family:

        [0, 1] --*255------> [0, 255]   (Keras EfficientNet*)
        [0, 1] --*2, -1----> [-1, 1]    (ResNet50V2 / Xception)

    Keras' EfficientNet applications already contain their own
    ``Rescaling`` + ``Normalization`` (ImageNet statistics) layers, which is why
    raw [0, 255] is the correct contract for them.
    ``model.validate_input_range()`` cross-checks this against the backbone.
    """
    lo, hi = MODEL_INPUT_RANGE
    return tf.keras.layers.Rescaling(scale=float(hi - lo), offset=float(lo))


def _make_augmentation_layer() -> tf.keras.Sequential:
    """Build the training-only augmentation pipeline.

    All transforms are **mild and medically realistic** so they increase
    invariance without distorting lesion morphology:

    * Random Flip (horizontal & vertical) — skin lesions are orientation-
      independent; a lesion on the arm looks the same flipped.
    * Random Rotation (+/-5%) — small rotations account for camera tilt.
    * Random Zoom (+/-10%) — simulates variable magnification / distance.
    * Random Translation (+/-10%) — accounts for off-centre framing.
    * Random Contrast (0.1) — mild lighting variation between images.
    * Random Brightness (0.1) — mild exposure variation.

    These layers receive inputs in the [0, 1] range (after decode, before the
    final rescale to ``config.MODEL_INPUT_RANGE``).  Keras' RandomContrast and
    RandomBrightness default to ``value_range=(0, 255)``, so the range is set
    explicitly below.

    NOT used (would change medically relevant features):
    * Shear — distorts lesion shape.
    * Large rotation (> 15 degrees) — changes anatomical context.
    * Large colour jitter — could mask clinically-significant colour.
    """
    return tf.keras.Sequential([
        # Orientation invariance — a lesion photographed upside-down or mirrored
        # is the same lesion (dermoscopy has no canonical orientation).
        tf.keras.layers.RandomFlip(mode="horizontal_and_vertical", seed=SEED),
        tf.keras.layers.RandomRotation(
            factor=AUG_ROTATION, fill_mode="nearest", seed=SEED
        ),
        tf.keras.layers.RandomZoom(
            height_factor=AUG_ZOOM, width_factor=AUG_ZOOM,
            fill_mode="nearest", seed=SEED,
        ),
        tf.keras.layers.RandomTranslation(
            height_factor=AUG_TRANSLATION, width_factor=AUG_TRANSLATION,
            fill_mode="nearest", seed=SEED,
        ),
        # NOTE: Keras >= 3 defaults ``value_range`` of both photometric layers to
        # (0, 255).  The pipeline works in [0, 1] here, so the range MUST be set
        # explicitly — otherwise every pixel saturates and the image is destroyed.
        tf.keras.layers.RandomContrast(
            factor=AUG_CONTRAST, value_range=(0.0, 1.0), seed=SEED
        ),
        tf.keras.layers.RandomBrightness(
            factor=AUG_BRIGHTNESS, value_range=(0.0, 1.0), seed=SEED
        ),
    ], name="train_augment")


# ===========================================================================
# 3. Dataset construction (tf.data)
# ===========================================================================

def _make_dataset(
    df: pd.DataFrame,
    augment: bool,
    batch_size: int = BATCH_SIZE,
    shuffle: bool = False,
) -> tf.data.Dataset:
    """Create a ``tf.data.Dataset`` from a manifest DataFrame.

    Pipeline order (identical for all splits):
        [shuffle paths]             (training only, before the expensive decode)
        -> decode (uint8 -> float32 [0,1])
        -> resize to IMAGE_SIZE     (all splits, antialiased)
        -> [augment]                (training only, operates on [0,1])
        -> clip to [0,1]            (training only)
        -> scale to MODEL_INPUT_RANGE  (all splits — [0,255] for EfficientNet)
        -> batch + prefetch

    Parameters
    ----------
    df         — DataFrame with columns ``image_id`` and ``label``.
    augment    — if True, apply the training augmentation pipeline.
    batch_size — batch size.
    shuffle    — if True, shuffle once per epoch with ``SEED`` (training only).
                 Shuffling the (cheap) path/label pairs *before* decoding avoids
                 filling the shuffle buffer with decoded images.
    """
    file_paths = [os.path.join(str(IMAGE_DIR), f"{r['image_id']}.jpg")
                  for _, r in df.iterrows()]
    labels = df["label"].astype(int).values

    ds = tf.data.Dataset.from_tensor_slices((file_paths, labels))

    if shuffle:
        ds = ds.shuffle(buffer_size=len(file_paths), seed=SEED,
                        reshuffle_each_iteration=True)

    def _load_and_decode(path):
        img = tf.io.read_file(path)
        img = tf.io.decode_image(img, channels=3, expand_animations=False)
        return tf.image.convert_image_dtype(img, tf.float32)   # [0,255] -> [0,1]

    ds = ds.map(lambda p, l: (_load_and_decode(p), l),
                num_parallel_calls=PARALLEL)

    # Resize — applied to every split
    resize_layer = _make_resize_layer()
    ds = ds.map(lambda x, y: (resize_layer(x, training=True), y),
                num_parallel_calls=PARALLEL)

    # Augment — training only (after resize, before the input scaling)
    if augment:
        aug = _make_augmentation_layer()
        ds = ds.map(lambda x, y: (aug(x, training=True), y),
                    num_parallel_calls=PARALLEL)
        # RandomBrightness / RandomContrast can push values slightly outside
        # [0, 1]; clipping keeps the model input in the expected range.
        ds = ds.map(lambda x, y: (tf.clip_by_value(x, 0.0, 1.0), y),
                    num_parallel_calls=PARALLEL)

    # Scale to the range the backbone expects — applied to every split
    input_layer = _make_model_input_layer()
    ds = ds.map(lambda x, y: (input_layer(x, training=True), y),
                num_parallel_calls=PARALLEL)

    ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    return ds


def build_datasets(
    batch_size: int = BATCH_SIZE,
) -> Tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, dict]:
    """Build train / val / test tf.data datasets from split manifests.

    Assumes ``create_grouped_splits()`` has already been run and the manifest
    CSVs exist in ``data/``.

    Returns
    -------
    train_ds, val_ds, test_ds : tf.data.Dataset
    metadata                  : dict with class names, class weights, etc.
    """
    train_df = pd.read_csv(DATA_DIR / "train_manifest.csv")
    val_df = pd.read_csv(DATA_DIR / "val_manifest.csv")
    test_df = pd.read_csv(DATA_DIR / "test_manifest.csv")

    print(f"\n[Dataset] Train images: {len(train_df)}")
    print(f"[Dataset] Val   images: {len(val_df)}")
    print(f"[Dataset] Test  images: {len(test_df)}")

    train_ds = _make_dataset(train_df, augment=True, batch_size=batch_size,
                             shuffle=True)
    val_ds = _make_dataset(val_df, augment=False, batch_size=batch_size)
    test_ds = _make_dataset(test_df, augment=False, batch_size=batch_size)

    # --- Class weights (from training set only) -----------------------------
    class_w = get_class_weights(train_df)

    metadata = {
        "class_names": CLASS_NAMES,
        "num_classes": len(CLASS_NAMES),
        "image_size": list(IMAGE_SIZE),
        "input_range": list(MODEL_INPUT_RANGE),
        "batch_size": batch_size,
        "class_weights": {k: float(v) for k, v in class_w.items()},
        "train_counts": train_df["label"].value_counts().sort_index().to_dict(),
        "val_counts": val_df["label"].value_counts().sort_index().to_dict(),
        "test_counts": test_df["label"].value_counts().sort_index().to_dict(),
    }

    # Save metadata for reproducibility
    meta_path = DATA_DIR / "dataset_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    return train_ds, val_ds, test_ds, metadata


# ===========================================================================
# 4. Class-weight helper
# ===========================================================================

def get_class_weights(train_df: pd.DataFrame) -> Dict[int, float]:
    """Compute inverse-frequency class weights from the training labels."""
    labels = sorted(train_df["label"].unique())
    counts = train_df["label"].value_counts().to_dict()
    weights = compute_class_weight(
        class_weight="balanced", classes=np.array(labels), y=train_df["label"].values
    )
    result = {int(c): float(w) for c, w in zip(labels, weights)}
    print("\n[Class weights] (training set, balanced)")
    for c in labels:
        print(f"  {CLASS_NAMES[c]:>6} (label {c}): "
              f"count={counts.get(c, 0):>5}  weight={result[c]:.3f}")
    return result


def print_class_distribution(df: pd.DataFrame, name: str = "") -> None:
    """Pretty-print per-class image counts and percentages."""
    total = len(df)
    print(f"\nClass distribution{' (' + name + ')' if name else ''}: "
          f"{total} images total")
    print(f"  {'Class':>8} | {'count':>6} | {'%':>6} | weight")
    print("  " + "-" * 42)
    w = get_class_weights(df)
    for c in sorted(df["label"].unique()):
        cnt = (df["label"] == c).sum()
        print(f"  {CLASS_NAMES[c]:>8} | {cnt:>6} | {cnt / total * 100:>5.1f}% | {w.get(c, 0):.3f}")


def load_manifests() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Read the group-stratified split manifests written by ``dataset.py``.

    Returns ``(train_df, val_df, test_df)`` — each with the columns
    ``lesion_id, image_id, dx, ..., label``.  Used by evaluation and Grad-CAM,
    which need the raw labels and file names rather than batched tensors.
    """
    frames = []
    for split in ("train", "val", "test"):
        path = DATA_DIR / f"{split}_manifest.csv"
        if not path.exists():
            raise FileNotFoundError(
                f"Missing split manifest {path}. Run:\n"
                "    python -m ml.src.dataset --inspect\n"
                "    python -m ml.src.dataset --split"
            )
        frames.append(pd.read_csv(path))
    return tuple(frames)  # type: ignore[return-value]
