"""
Augmentation preview / quality-assurance utility.

The training pipeline augments on the fly, which makes it easy to ship a
transform that quietly destroys clinically relevant information.  This module
renders originals next to several random augmented variants and prints pixel
statistics, so the augmentation can be *looked at* once and then trusted:

    python -m ml.src.augmentation                  # 4 images x 5 variants
    python -m ml.src.augmentation --n 6 --variants 4 --split train

What to check in the output figure
----------------------------------
* the lesion stays centred and fully visible (rotation/zoom do not cut it off),
* colours stay realistic (no washed-out or posterised skin tones),
* no black/white borders appear inside the frame,
* the augmented mean brightness stays close to the original (proves the
  photometric layers were given the correct ``value_range``).
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Dict, List

# Ensure this directory (src/) is on sys.path so `import config` works whether
# the module is imported as a package or executed as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import tensorflow as tf

import config
import preprocessing
from config import ARTIFACTS_DIR, CLASS_NAMES, IMAGE_DIR, IMAGE_SIZE, SEED
from plots import plot_sample_grid


def _display_image(image_id: str) -> np.ndarray:
    """Load one dataset image as [0, 1] RGB at the model resolution."""
    from PIL import Image

    path = Path(IMAGE_DIR) / f"{image_id}.jpg"
    with Image.open(path) as im:
        rgb = im.convert("RGB").resize((IMAGE_SIZE[1], IMAGE_SIZE[0]), Image.LANCZOS)
    return np.asarray(rgb, dtype="float32") / 255.0


def preview_augmentations(
    n: int = 4,
    variants: int = 5,
    split: str = "train",
    out_path: Path = ARTIFACTS_DIR / "augmentation_preview.png",
    seed: int = SEED,
) -> Dict:
    """Render originals + random augmented variants; return pixel statistics."""
    import pandas as pd

    df = pd.read_csv(config.DATA_DIR / f"{split}_manifest.csv")
    # Spread the sample across classes so rare lesions are represented too.
    sample = df.groupby("label", group_keys=False).apply(
        lambda group: group.sample(n=1, random_state=seed)
    ).head(n)
    if len(sample) < n:
        sample = df.sample(n=n, random_state=seed)

    augment = preprocessing._make_augmentation_layer()
    images: List[np.ndarray] = []
    titles: List[str] = []
    stats_rows = []

    for _, row in sample.iterrows():
        original = _display_image(row["image_id"])
        images.append(original)
        titles.append(f"{row['dx']}\noriginal")

        for i in range(variants):
            augmented = augment(tf.convert_to_tensor(original[None, ...]),
                                training=True)[0].numpy()
            augmented = np.clip(augmented, 0.0, 1.0)
            images.append(augmented)
            titles.append(f"aug {i + 1}")

        augmented_stack = np.stack(images[-variants:])
        stats_rows.append({
            "image_id": row["image_id"],
            "class": row["dx"],
            "original_mean": round(float(original.mean()), 4),
            "augmented_mean": round(float(augmented_stack.mean()), 4),
            "augmented_min": round(float(augmented_stack.min()), 4),
            "augmented_max": round(float(augmented_stack.max()), 4),
            "saturated_pixel_fraction": round(
                float(np.mean((augmented_stack <= 0.001) | (augmented_stack >= 0.999))), 4
            ),
        })

    plot_sample_grid(images, titles, out_path, ncols=variants + 1,
                     suptitle=f"Augmentation preview ({split} split) - "
                              f"column 1 = original",
                     figsize_per_cell=1.9)

    print(f"\n[Augmentation] Pixel statistics per image (sanity check):")
    print(f"  {'image_id':>14} | {'class':>6} | {'orig mean':>9} | "
          f"{'aug mean':>8} | {'aug min':>7} | {'aug max':>7} | {'saturated':>9}")
    print("  " + "-" * 78)
    for row in stats_rows:
        print(f"  {row['image_id']:>14} | {row['class']:>6} | "
              f"{row['original_mean']:>9.4f} | {row['augmented_mean']:>8.4f} | "
              f"{row['augmented_min']:>7.4f} | {row['augmented_max']:>7.4f} | "
              f"{row['saturated_pixel_fraction']:>9.4f}")
    print("\n[Augmentation] A saturated fraction near 0 and augmented means close "
          "to the original means indicate healthy, medically realistic transforms.")

    return {"figures": str(out_path), "per_image": stats_rows,
            "class_names": CLASS_NAMES, "split": split}


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preview the training augmentation.")
    parser.add_argument("--n", type=int, default=4, help="Number of source images.")
    parser.add_argument("--variants", type=int, default=5,
                        help="Augmented variants per source image.")
    parser.add_argument("--split", default="train", choices=["train", "val", "test"])
    parser.add_argument("--out", default=str(ARTIFACTS_DIR / "augmentation_preview.png"))
    return parser.parse_args(argv)


def main(argv=None) -> Dict:
    args = parse_args(argv)
    print("=" * 72)
    print("  MediMinds Skin Sense - augmentation preview")
    print("=" * 72)
    result = preview_augmentations(n=args.n, variants=args.variants,
                                   split=args.split, out_path=Path(args.out))
    print(f"\nFigure: {result['figures']}")
    print("=" * 72)
    return result


if __name__ == "__main__":
    main()
