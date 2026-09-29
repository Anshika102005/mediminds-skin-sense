"""
Plotting helpers shared by training, evaluation and explainability.

Everything writes PNG files with the non-interactive Agg backend, so the module
is safe to use on a headless machine.  All figure text is ASCII so it renders
identically on Windows consoles and in the browser/README.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Dict, List, Optional, Sequence

sys.path.insert(0, str(Path(__file__).resolve().parent))

import matplotlib

matplotlib.use("Agg")                     # headless: no display required

import matplotlib.pyplot as plt          # noqa: E402
import numpy as np                       # noqa: E402

PLOT_COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2", "#be185d"]

# Short ASCII labels for the 7 HAM10000 classes, used as plot titles
CLASS_LABELS = {
    "akiec": "akiec", "bcc": "bcc", "bkl": "bkl", "df": "df",
    "mel": "mel", "nv": "nv", "vasc": "vasc",
}


def _save(fig, out_path: Path) -> Path:
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[Plots] Saved {out_path}")
    return out_path


def plot_training_curves(
    histories: Sequence[Dict[str, List[float]]],
    out_path: Path,
    stage_labels: Optional[Sequence[str]] = None,
) -> Path:
    """Accuracy + loss curves for one or more training stages.

    ``histories`` is a list of Keras ``History.history`` dicts — passing several
    renders the stage boundary as a vertical dotted line, which makes the
    fine-tuning transition visible at a glance.
    """
    histories = list(histories)
    stage_labels = list(stage_labels or [f"Stage {i + 1}" for i in range(len(histories))])

    fig, axes = plt.subplots(1, 3, figsize=(16, 4.2))
    offset = 0
    for hist, label in zip(histories, stage_labels):
        epochs = list(range(offset + 1, offset + len(hist.get("loss", [])) + 1))

        axes[0].plot(epochs, hist.get("accuracy", []), color="#2563eb",
                     label=f"{label} train")
        axes[0].plot(epochs, hist.get("val_accuracy", []), color="#dc2626", linestyle="--",
                     label=f"{label} val")
        axes[1].plot(epochs, hist.get("loss", []), color="#2563eb", label=f"{label} train")
        axes[1].plot(epochs, hist.get("val_loss", []), color="#dc2626", linestyle="--",
                     label=f"{label} val")
        if "top3_accuracy" in hist:
            axes[2].plot(epochs, hist["top3_accuracy"], color="#2563eb",
                         label=f"{label} train")
            axes[2].plot(epochs, hist.get("val_top3_accuracy", []), color="#dc2626",
                         linestyle="--", label=f"{label} val")
        offset += len(hist.get("loss", []))

    axes[0].set(title="Top-1 accuracy", xlabel="epoch", ylabel="accuracy")
    axes[1].set(title="Loss", xlabel="epoch", ylabel="loss")
    axes[2].set(title="Top-3 accuracy", xlabel="epoch", ylabel="top-3 accuracy")
    boundary = len(histories[0].get("loss", []))
    for ax in axes:
        ax.grid(alpha=0.3)
        ax.legend(fontsize=8)
        if len(histories) > 1:
            ax.axvline(boundary, color="#6b7280", linestyle=":", linewidth=1.5)
    return _save(fig, out_path)


def plot_confusion_matrix(
    cm: np.ndarray,
    class_names: Sequence[str],
    out_path: Path,
    normalize: bool = False,
    title: str = "Confusion matrix",
) -> Path:
    """Heat-mapped confusion matrix (raw counts or row-normalised)."""
    cm = np.asarray(cm, dtype=float)
    if normalize:
        row_sums = cm.sum(axis=1, keepdims=True)
        cm = np.divide(cm, row_sums, out=np.zeros_like(cm), where=row_sums != 0)

    fig, ax = plt.subplots(figsize=(8.2, 7))
    im = ax.imshow(cm, cmap="Blues", vmin=0.0, vmax=cm.max() if cm.max() > 0 else 1.0)
    fig.colorbar(im, ax=ax, fraction=0.046)

    ax.set_xticks(range(len(class_names)), list(class_names), rotation=45, ha="right")
    ax.set_yticks(range(len(class_names)), list(class_names))
    ax.set(xlabel="Predicted", ylabel="True lesion class", title=title)

    threshold = cm.max() * 0.5 if cm.max() > 0 else 1.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            text = f"{cm[i, j]:.2f}" if normalize else f"{int(cm[i, j])}"
            ax.text(j, i, text, ha="center", va="center", fontsize=8,
                    color="white" if cm[i, j] > threshold else "#111827")
    return _save(fig, out_path)


def plot_per_class_metrics(
    report: Dict[str, Dict[str, float]],
    class_names: Sequence[str],
    out_path: Path,
) -> Path:
    """Grouped bars of precision / recall / F1 per class."""
    metrics = ["precision", "recall", "f1-score"]
    x = np.arange(len(class_names))
    width = 0.26

    fig, ax = plt.subplots(figsize=(10, 4.6))
    for i, metric in enumerate(metrics):
        values = [report.get(c, {}).get(metric, 0.0) for c in class_names]
        ax.bar(x + (i - 1) * width, values, width, label=metric, color=PLOT_COLORS[i])
    ax.set_xticks(x, list(class_names))
    ax.set(ylim=(0, 1.05), xlabel="lesion class", ylabel="score",
           title="Per-class precision / recall / F1")
    if "macro avg" in report:
        ax.axhline(report["macro avg"]["f1-score"], color="#111827", linestyle="--",
                   linewidth=1.2, label="macro-avg F1")
    ax.grid(alpha=0.3, axis="y")
    ax.legend(fontsize=8, ncol=4)
    return _save(fig, out_path)


def plot_roc_curves(
    per_class: Dict[str, Dict[str, object]],
    out_path: Path,
    macro_auc: float,
) -> Path:
    """One-vs-rest ROC curves for every class."""
    fig, ax = plt.subplots(figsize=(6.4, 6))
    for i, (name, data) in enumerate(per_class.items()):
        ax.plot(data["fpr"], data["tpr"], color=PLOT_COLORS[i % len(PLOT_COLORS)],
                linewidth=1.6, label=f"{name} (AUC={data['auc']:.3f})")
    ax.plot([0, 1], [0, 1], color="#9ca3af", linestyle=":", linewidth=1)
    ax.set(xlabel="False positive rate", ylabel="True positive rate",
           title=f"One-vs-rest ROC (macro AUC = {macro_auc:.3f})",
           xlim=(0, 1), ylim=(0, 1.02))
    ax.grid(alpha=0.3)
    ax.legend(fontsize=8, loc="lower right")
    return _save(fig, out_path)


def plot_sample_grid(
    images: Sequence[np.ndarray],
    titles: Sequence[str],
    out_path: Path,
    ncols: int = 6,
    suptitle: str = "",
    figsize_per_cell: float = 2.1,
) -> Path:
    """Grid of RGB images (accepts [0, 1] or [0, 255] float arrays)."""
    n = len(images)
    ncols = max(1, min(ncols, n))
    nrows = int(np.ceil(n / ncols))
    fig, axes = plt.subplots(nrows, ncols,
                             figsize=(figsize_per_cell * ncols, figsize_per_cell * nrows))
    axes = np.atleast_1d(axes).ravel()

    for ax, img, title in zip(axes, images, titles):
        arr = np.asarray(img, dtype="float32")
        if arr.max() > 1.5:                 # stored as [0, 255]
            arr = arr / 255.0
        ax.imshow(np.clip(arr, 0.0, 1.0))
        ax.set_title(title, fontsize=8)
        ax.axis("off")
    for ax in axes[n:]:
        ax.axis("off")
    if suptitle:
        fig.suptitle(suptitle, fontsize=11)
    return _save(fig, out_path)

