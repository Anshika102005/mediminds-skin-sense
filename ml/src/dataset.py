"""
Dataset inspection and split creation for the HAM10000 skin-lesion collection.

Responsibilities
----------------
1. **inspect_dataset()** — a comprehensive, printed JSON-style report covering:
   number of classes, class names, images-per-class, image formats,
   corrupted/unreadable images, duplicate images, class imbalance,
   and image-resolution distribution.

2. **create_grouped_splits()** — stratified group-aware train/val/test splits
   that key on `lesion_id` so that every image of the same lesion lands in
   exactly one split (prevents patient/lesion data leakage).

3. **compute_class_weights()** — inverse-frequency class weights to counter
   the severe class imbalance during training.

Run directly to inspect the dataset and write the split manifests:

    python -m ml.src.dataset --inspect
    python -m ml.src.dataset --split
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

# Ensure this directory (src/) is on sys.path so `import config` works
# whether the file is run as a script or imported as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from collections import Counter
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from PIL import Image, UnidentifiedImageError
from sklearn.model_selection import StratifiedGroupKFold

import config
from config import (
    ARTIFACTS_DIR, CLASS_NAMES, DATA_DIR, DX_TO_NAME, IMAGE_SIZE,
    IMAGE_DIR, METADATA_CSV, SEED, TEST_RATIO, TRAIN_RATIO, VAL_RATIO,
)

# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def _safe_open(path: str) -> Tuple[bool, str, Tuple[int, int], str]:
    """Try to open *path* with PIL.

    Returns (is_valid, error_message, (width, height), mode).
    """
    try:
        with Image.open(path) as im:
            im.verify()                     # PIL: verify integrity (close after)
        with Image.open(path) as im:
            return True, "", im.size, im.mode
    except (UnidentifiedImageError, OSError) as exc:
        return False, str(exc), (0, 0), ""


def _average_hash(path: str, hash_size: int = 16) -> str:
    """Perceptual average-hash using only PIL + numpy (imagehash not installed).

    16x16 is used (not the classic 8x8) so that subtly different lesions
    are *not* collapsed into the same hash — 8x8 was too coarse for
    dermoscopic imagery where most images share a similar background.

    Two images that look *almost* identical (same lesion, different crop /
    compression) will produce the same hash.
    """
    try:
        with Image.open(path) as im:
            im = im.convert("L").resize((hash_size, hash_size), Image.LANCZOS)
            pixels = np.array(im, dtype=np.int64).flatten()
            avg = pixels.mean()
            bits = "".join("1" if p > avg else "0" for p in pixels)
            return hashlib.md5(bits.encode()).hexdigest()[:16]
    except Exception:
        return ""


def _exact_hash(path: str) -> str:
    """MD5 of the raw file bytes — catches *exact* duplicate files."""
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# 1. Full dataset inspection
# ---------------------------------------------------------------------------

def inspect_dataset() -> Dict:
    """Inspect the raw dataset and return a rich statistics dictionary.

    All information requested in Step 1 is collected here and printed in a
    readable, copy-paste-friendly format.
    """
    print("=" * 70)
    print("  DATASET INSPECTION — HAM10000")
    print("=" * 70)

    stats: Dict = {}

    # --- 1. Load metadata ---------------------------------------------------
    df = pd.read_csv(METADATA_CSV)
    stats["metadata_rows"] = len(df)

    print(f"\n[1] Source path\n    {IMAGE_DIR}")
    print(f"    Metadata CSV: {METADATA_CSV}")
    print(f"    Metadata rows: {len(df)}")
    print(f"    Metadata columns: {list(df.columns)}")

    # --- 2. Number of classes + class names --------------------------------
    class_counts = df["dx"].value_counts().to_dict()
    stats["num_classes"] = len(class_counts)
    stats["class_names"] = {k: v for k, v in sorted(class_counts.items())}
    stats["class_descriptions"] = DX_TO_NAME

    print(f"\n[2] Number of classes: {stats['num_classes']}")
    for code in sorted(class_counts):
        print(f"    {code:>6}  ({DX_TO_NAME.get(code, '?'):>50s})  "
              f"-> {class_counts[code]:>5} images "
              f"({class_counts[code]/len(df)*100:5.1f}%)")

    # --- 3. Image files on disk ---------------------------------------------
    all_files = sorted(
        f for f in os.listdir(IMAGE_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tif"))
    )
    stats["total_image_files"] = len(all_files)

    # extension distribution
    ext_counts = Counter(os.path.splitext(f)[1].lower() for f in all_files)
    stats["image_formats"] = dict(ext_counts)
    print(f"\n[3] Image files on disk: {len(all_files)}")
    print(f"    Formats: {dict(ext_counts)}")

    # images referenced by metadata
    meta_images = set(df["image_id"].astype(str) + ".jpg")
    disk_images = set(all_files)
    missing_on_disk = meta_images - disk_images
    extra_on_disk = disk_images - meta_images
    stats["images_missing_on_disk"] = len(missing_on_disk)
    stats["images_extra_on_disk"] = len(extra_on_disk)
    print(f"    Images in metadata but missing on disk: {len(missing_on_disk)}")
    print(f"    Images on disk but not in metadata: {len(extra_on_disk)}")

    # --- 4. Corrupted / unreadable images ----------------------------------
    print(f"\n[4] Scanning for corrupted images (this may take a minute)...")
    corrupted: List[str] = []
    img_sizes: Counter = Counter()
    img_modes: Counter = Counter()

    for fname in all_files:
        fpath = os.path.join(IMAGE_DIR, fname)
        ok, err, size, mode = _safe_open(fpath)
        if not ok:
            corrupted.append({"file": fname, "error": err})
        else:
            img_sizes[size] += 1
            img_modes[mode] += 1

    stats["corrupted_images"] = corrupted
    stats["img_size_distribution"] = {str(k): v for k, v in sorted(img_sizes.items(), key=lambda x: -x[1])}
    stats["img_mode_distribution"] = dict(img_modes)
    print(f"    Corrupted / unreadable: {len(corrupted)}")
    for c in corrupted[:20]:
        print(f"      {c['file']}  —  {c['error']}")
    if len(corrupted) > 20:
        print(f"      ... and {len(corrupted) - 20} more")
    print(f"    Resolution distribution:")
    for size, count in sorted(img_sizes.items(), key=lambda x: -x[1]):
        print(f"      {size[0]} x {size[1]}  -> {count}")
    print(f"    Channel modes: {dict(img_modes)}")

    # --- 5. Duplicate image detection --------------------------------------
    print(f"\n[5] Detecting duplicate images (perceptual + exact hash)...")
    exact_groups: Dict[str, List[str]] = {}
    perceptual_groups: Dict[str, List[str]] = {}

    for fname in all_files:
        fpath = os.path.join(IMAGE_DIR, fname)
        eh = _exact_hash(fpath)
        exact_groups.setdefault(eh, []).append(fname)
        ph = _average_hash(fpath)
        perceptual_groups.setdefault(ph, []).append(fname)

    exact_dups = {h: v for h, v in exact_groups.items() if len(v) > 1}
    perc_dups = {h: v for h, v in perceptual_groups.items() if len(v) > 1}
    stats["exact_duplicates"] = exact_dups
    stats["perceptual_duplicates"] = perc_dups
    stats["total_exact_duplicate_files"] = sum(len(v) - 1 for v in exact_dups.values())
    stats["total_perceptual_duplicate_files"] = sum(len(v) - 1 for v in perc_dups.values())

    print(f"    Exact duplicate files (same byte content): "
          f"{stats['total_exact_duplicate_files']}")
    print(f"    Perceptual near-duplicates (same avg-hash): "
          f"{stats['total_perceptual_duplicate_files']}")
    if exact_dups:
        print("    Exact duplicate groups:")
        for h, files in list(exact_dups.items())[:5]:
            print(f"      hash={h}: {files}")
    if perc_dups and not exact_dups:
        print(f"    Perceptual duplicate groups (showing first {min(5, len(perc_dups))}):")
        for h, files in list(perc_dups.items())[:5]:
            print(f"      hash={h}: {files}")

    # --- 6 & 7. Class imbalance + lesion grouping --------------------------
    print(f"\n[6] Class imbalance analysis")
    counts = np.array(list(class_counts.values()))
    stats["imbalance_ratio"] = float(counts.max() / counts.min()) \
        if counts.min() > 0 else float("inf")
    stats["imbalance_report"] = {
        "max_class_count": int(counts.max()),
        "min_class_count": int(counts.min()),
        "ratio_max_min": float(counts.max() / counts.min()),
    }
    print(f"    Imbalance ratio (max/min): {stats['imbalance_ratio']:.1f} : 1")
    print(f"    Minority classes (vasc={class_counts.get('vasc',0)}, "
          f"df={class_counts.get('df',0)}) are severely under-represented.")
    print(f"    -> Class weighting + stratified splitting recommended.")

    print(f"\n[7] Lesion grouping (data-leakage analysis)")
    lesion_counts = df.groupby("lesion_id").size()
    multi_lesions = lesion_counts[lesion_counts > 1]
    stats["total_lesion_ids"] = int(df["lesion_id"].nunique())
    stats["multi_image_lesions"] = int(len(multi_lesions))
    stats["multi_image_lesion_images"] = int(multi_lesions.sum())
    print(f"    Unique lesion_id values: {stats['total_lesion_ids']}")
    print(f"    Lesions with >1 image: {stats['multi_image_lesions']} "
          f"({stats['multi_image_lesion_images']} images)")
    print(f"    -> Split MUST be group-aware on `lesion_id` to avoid leakage.")

    # --- 8. Metadata completeness ------------------------------------------
    missing_meta = df.isnull().sum().to_dict()
    stats["missing_metadata"] = {k: int(v) for k, v in missing_meta.items() if v > 0}
    print(f"\n[8] Missing metadata values per column:")
    for col, n in missing_meta.items():
        if n > 0:
            print(f"    {col}: {n} missing")

    # --- 9. Age / sex / localization summaries (secondary) -----------------
    print(f"\n[9] Demographic metadata (context only, not used as features)")
    if "age" in df.columns:
        print(f"    Age: mean={df['age'].mean():.1f}, "
              f"median={df['age'].median():.1f}, "
              f"min={df['age'].min():.0f}, max={df['age'].max():.0f}, "
              f"missing={df['age'].isnull().sum()}")
    if "sex" in df.columns:
        print(f"    Sex: {df['sex'].value_counts().to_dict()}")
    if "localization" in df.columns:
        loc = df["localization"].value_counts()
        print(f"    Top localizations: {loc.head(5).to_dict()}")

    # --- Save report --------------------------------------------------------
    report_path = ARTIFACTS_DIR / "dataset_inspection_report.json"
    with open(report_path, "w") as f:
        json.dump(stats, f, indent=2, default=str)
    print(f"\n{'=' * 70}")
    print(f"  Full report saved to: {report_path}")
    print(f"{'=' * 70}\n")

    return stats


# ---------------------------------------------------------------------------
# 2. Group-stratified split creation
# ---------------------------------------------------------------------------

def create_grouped_splits(
    train_ratio: float = TRAIN_RATIO,
    val_ratio: float = VAL_RATIO,
    test_ratio: float = TEST_RATIO,
    seed: int = SEED,
    metadata_path: str | Path = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict]:
    """Create train / val / test splits stratified by class *and* grouped by
    `lesion_id` so that all images of one lesion stay together.

    Parameters
    ----------
    metadata_path : optional path to a *cleaned* metadata CSV.
        Defaults to ``METADATA_CSV``.  Pass the cleaned manifest produced by
        the cleaning step so duplicates / corrupted images are excluded.

    Returns three DataFrames (train_df, val_df, test_df) and a dict of summary
    stats.  Manifests are written to ``data/``.
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
        "Ratios must sum to 1.0"

    if metadata_path is None:
        metadata_path = METADATA_CSV
    df = pd.read_csv(metadata_path)

    # Build a lesion-level table: one row per lesion with its class label.
    lesion_df = (
        df.groupby("lesion_id")["dx"]
        .first()
        .reset_index()
        .rename(columns={"dx": "class"})
    )

    # --- Step A: hold out the test set first (group-aware + stratified) -----
    # n_splits chosen so that the test fraction ≈ test_ratio at the *group*
    # level.
    n_total = len(lesion_df)
    n_test = int(round(n_total * test_ratio))
    n_test = max(n_test, 1)

    # Use StratifiedGroupKFold with enough folds; take the first fold as test.
    n_folds = max(2, int(round(1.0 / test_ratio)))
    skf = StratifiedGroupKFold(
        n_splits=n_folds, shuffle=True, random_state=seed
    )
    groups = lesion_df["lesion_id"].values
    labels = lesion_df["class"].values

    train_val_idx, test_idx = next(skf.split(lesion_df, labels, groups))
    train_val_lesions = lesion_df.iloc[train_val_idx]
    test_lesions = lesion_df.iloc[test_idx]

    # --- Step B: split remaining into train / val (stratified, group-aware) -
    remaining_ratio = 1.0 - test_ratio
    target_val_ratio = val_ratio / remaining_ratio

    n_folds_inner = max(2, int(round(1.0 / target_val_ratio)))
    skf_inner = StratifiedGroupKFold(
        n_splits=n_folds_inner, shuffle=True, random_state=seed
    )
    groups_inner = train_val_lesions["lesion_id"].values
    labels_inner = train_val_lesions["class"].values

    train_idx, val_idx = next(skf_inner.split(train_val_lesions, labels_inner, groups_inner))
    train_lesions = train_val_lesions.iloc[train_idx]
    val_lesions = train_val_lesions.iloc[val_idx]

    # --- Map lesion-level splits back to image-level rows -------------------
    train_df = df[df["lesion_id"].isin(train_lesions["lesion_id"])].copy()
    val_df = df[df["lesion_id"].isin(val_lesions["lesion_id"])].copy()
    test_df = df[df["lesion_id"].isin(test_lesions["lesion_id"])].copy()

    # Assign a numeric label column
    for d in (train_df, val_df, test_df):
        d["label"] = d["dx"].map({c: i for i, c in enumerate(CLASS_NAMES)})

    # Shuffle within each split
    train_df = train_df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    val_df = val_df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    test_df = test_df.sample(frac=1.0, random_state=seed).reset_index(drop=True)

    # --- Summary ------------------------------------------------------------
    summary = {
        "train_images": len(train_df),
        "val_images": len(val_df),
        "test_images": len(test_df),
        "train_lesions": len(train_lesions),
        "val_lesions": len(val_lesions),
        "test_lesions": len(test_lesions),
        "train_class_distribution": {c: int((train_df["dx"] == c).sum()) for c in CLASS_NAMES},
        "val_class_distribution":   {c: int((val_df["dx"] == c).sum())   for c in CLASS_NAMES},
        "test_class_distribution":  {c: int((test_df["dx"] == c).sum())  for c in CLASS_NAMES},
        "image_size": list(IMAGE_SIZE),
    }

    # --- Persist manifests --------------------------------------------------
    train_path = DATA_DIR / "train_manifest.csv"
    val_path = DATA_DIR / "val_manifest.csv"
    test_path = DATA_DIR / "test_manifest.csv"

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    print("OK  Split manifests written:")
    print(f"  {train_path}  ({len(train_df)} images, {len(train_lesions)} lesions)")
    print(f"  {val_path}    ({len(val_df)} images, {len(val_lesions)} lesions)")
    print(f"  {test_path}   ({len(test_df)} images, {len(test_lesions)} lesions)")

    print("\n  Class distribution (train / val / test):")
    print(f"  {'Class':>8} | {'train':>6} {'val':>6} {'test':>6}")
    print("  " + "-" * 36)
    for c in CLASS_NAMES:
        print(f"  {c:>8} | {summary['train_class_distribution'][c]:>6} "
              f"{summary['val_class_distribution'][c]:>6} "
              f"{summary['test_class_distribution'][c]:>6}")

    return train_df, val_df, test_df, summary


# ---------------------------------------------------------------------------
# 3. Class-weight computation
# ---------------------------------------------------------------------------

def compute_class_weights(train_df: pd.DataFrame) -> Dict[int, float]:
    """Inverse-frequency class weights based on *training* labels only.

    Returns a dict mapping integer label -> weight.
    """
    counts = train_df["label"].value_counts().sort_index()
    total = counts.sum()
    weights = {int(lbl): total / (len(CLASS_NAMES) * counts[lbl]) for lbl in counts.index}
    print("\nClass weights (training set only):")
    for lbl in sorted(weights):
        print(f"  {CLASS_NAMES[lbl]:>6} (label {lbl}): weight={weights[lbl]:.3f}")
    return weights


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Inspect the HAM10000 dataset and create group-stratified splits."
    )
    parser.add_argument("--inspect", action="store_true",
                        help="Run full dataset inspection report.")
    parser.add_argument("--split", action="store_true",
                        help="Create train/val/test splits (group-stratified).")
    args = parser.parse_args()

    if args.inspect:
        inspect_dataset()

    if args.split:
        # need a clean metadata without corrupted/duplicates —
        # for now inspect first to surface issues
        results = inspect_dataset()
        # If corrupted images exist, they are excluded from the manifest.
        corrupted_names = {c["file"] for c in results.get("corrupted_images", [])}
        df = pd.read_csv(METADATA_CSV)
        df = df[~df["image_id"].apply(lambda x: x + ".jpg" in corrupted_names)]
        # Remove exact duplicates: keep one file per exact hash
        seen_hashes: set = set()
        keep_rows = []
        for _, row in df.iterrows():
            fp = os.path.join(IMAGE_DIR, row["image_id"] + ".jpg")
            h = _exact_hash(fp)
            if h not in seen_hashes:
                seen_hashes.add(h)
                keep_rows.append(row)
        df = pd.DataFrame(keep_rows)
        df.to_csv(DATA_DIR / "cleaned_metadata.csv", index=False)
        print(f"\nCleaned metadata: {len(df)} rows "
              f"(removed {len(pd.read_csv(METADATA_CSV)) - len(df)} corrupted+duplicates)")

        tr, va, te, summ = create_grouped_splits(
            metadata_path=DATA_DIR / "cleaned_metadata.csv"
        )
        print(f"\nSplit summary: {json.dumps(summ, indent=2, default=str)}")
