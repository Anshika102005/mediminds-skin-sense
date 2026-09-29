"""
Final evaluation of the frozen MediMinds Skin Sense model.

The test split is touched **exactly once**, by this module, after training has
finished.  Nothing here feeds back into training — that is what keeps the
reported accuracy honest (no test-set leakage).

Reported metrics
----------------
* top-1 and top-3 accuracy
* balanced accuracy (macro recall) — the honest number under 58:1 class imbalance
* per-class precision / recall / F1 + support
* macro and weighted averages, Cohen's kappa
* one-vs-rest macro ROC-AUC and per-class AUC
* confusion matrices (counts and row-normalised)
* clinical screening blocks: recall of the high-risk classes (melanoma, BCC) and
  a grouped malignant-vs-benign sensitivity / specificity

Usage
-----
    python -m ml.src.evaluate                      # best_model.keras on the test split
    python -m ml.src.evaluate --split val          # same metrics on validation
    python -m ml.src.evaluate --no-tta             # skip flip-TTA
    python -m ml.src.evaluate --model ml/artifacts/smoke/best_model.keras --split val
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

# Ensure this directory (src/) is on sys.path so `import config` works whether
# the module is imported as a package or executed as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np

import config
import runtime                      # exports the TF thread env vars

runtime.configure()

import tensorflow as tf             # noqa: E402  (after runtime.configure)
from sklearn.metrics import (       # noqa: E402
    accuracy_score, balanced_accuracy_score, cohen_kappa_score, confusion_matrix,
    precision_recall_fscore_support, roc_auc_score, roc_curve,
)

import model as model_lib           # noqa: E402
import preprocessing                # noqa: E402
from config import (                # noqa: E402
    ARTIFACTS_DIR, BEST_MODEL_PATH, CLASS_NAMES, DISCLAIMER, HIGH_RECALL_CLASSES,
    IMAGE_SIZE, SEED, USE_TTA,
)
from plots import (                 # noqa: E402
    plot_confusion_matrix, plot_per_class_metrics, plot_roc_curves,
)

# Classes grouped as "potentially malignant" for the screening block.  This is a
# research convenience grouping, NOT a clinical triage rule.
MALIGNANT_GROUP = ["mel", "bcc", "akiec"]


# ===========================================================================
# 1. Inference
# ===========================================================================

def tta_views(batch: tf.Tensor) -> List[tf.Tensor]:
    """Identity + 3 flip views (horizontal, vertical, both)."""
    hflip = tf.image.flip_left_right(batch)
    vflip = tf.image.flip_up_down(batch)
    both = tf.image.flip_up_down(hflip)
    return [batch, hflip, vflip, both]


def predict_probabilities(
    model: tf.keras.Model,
    ds: tf.data.Dataset,
    use_tta: bool = False,
) -> Tuple[np.ndarray, np.ndarray]:
    """Return ``(probabilities, y_true)`` for a ``(images, labels)`` dataset.

    With ``use_tta`` the softmax outputs of the identity + 3 flip views are
    averaged, which is a cheap, label-preserving way to reduce prediction
    variance (skin lesions have no canonical orientation).
    """
    probs: List[np.ndarray] = []
    truths: List[np.ndarray] = []

    for images, labels in ds:
        if use_tta:
            views = tta_views(images)
            stacked = np.mean(
                [model.predict_on_batch(v) for v in views], axis=0
            )
        else:
            stacked = model.predict_on_batch(images)
        probs.append(np.asarray(stacked, dtype=np.float64))
        truths.append(np.asarray(labels, dtype=np.int64))

    return np.concatenate(probs, axis=0), np.concatenate(truths, axis=0)


# ===========================================================================
# 2. Metrics
# ===========================================================================

def top_k_accuracy(probs: np.ndarray, y_true: np.ndarray, k: int = 3) -> float:
    """Fraction of samples whose true label is within the top-k predictions."""
    k = min(k, probs.shape[1])
    top_k = np.argsort(-probs, axis=1)[:, :k]
    return float(np.mean([y_true[i] in top_k[i] for i in range(len(y_true))]))


def compute_metrics(
    probs: np.ndarray,
    y_true: np.ndarray,
    class_names: Sequence[str] = CLASS_NAMES,
) -> Dict:
    """Compute the full metric bundle from class probabilities."""
    y_pred = np.argmax(probs, axis=1)
    labels = list(range(len(class_names)))

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, zero_division=0
    )
    per_class = {}
    for i, name in enumerate(class_names):
        per_class[name] = {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1-score": float(f1[i]),
            "support": int(support[i]),
        }

    # One-vs-rest AUC — only defined for classes that appear in y_true.
    per_class_auc: Dict[str, Optional[float]] = {}
    valid_aucs = []
    for i, name in enumerate(class_names):
        binary = (y_true == i).astype(int)
        if binary.min() == binary.max():
            per_class_auc[name] = None
            continue
        auc = float(roc_auc_score(binary, probs[:, i]))
        per_class_auc[name] = auc
        valid_aucs.append(auc)

    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average="macro", zero_division=0
    )
    weighted_f1 = float(precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average="weighted", zero_division=0
    )[2])

    cm = confusion_matrix(y_true, y_pred, labels=labels)
    row_sums = cm.sum(axis=1, keepdims=True)
    cm_norm = np.divide(cm, row_sums, out=np.zeros_like(cm, dtype=float),
                        where=row_sums != 0)

    return {
        "n_images": int(len(y_true)),
        "class_names": list(class_names),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "top3_accuracy": top_k_accuracy(probs, y_true, k=3),
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "macro_f1": float(macro_f1),
        "weighted_f1": weighted_f1,
        "cohen_kappa": float(cohen_kappa_score(y_true, y_pred)),
        "macro_roc_auc_ovr": float(np.mean(valid_aucs)) if valid_aucs else None,
        "per_class_roc_auc": per_class_auc,
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_normalized": np.round(cm_norm, 4).tolist(),
        "high_recall_classes": {
            name: {"recall": per_class[name]["recall"],
                   "support": per_class[name]["support"]}
            for name in HIGH_RECALL_CLASSES if name in per_class
        },
        "_cm": cm,
        "_probs": probs,
        "_y_true": y_true,
        "_y_pred": y_pred,
    }


def malignant_screening_block(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: Sequence[str] = CLASS_NAMES,
) -> Dict[str, float]:
    """Sensitivity / specificity for 'potentially malignant' vs 'benign'.

    ``mel``, ``bcc`` and ``akiec`` are grouped as the malignant side, everything
    else as benign.  Reported as a *research screening* metric only — the product
    disclaimer still applies.
    """
    index = {name: i for i, name in enumerate(class_names)}
    malignant_ids = {index[name] for name in MALIGNANT_GROUP if name in index}

    true_malignant = np.isin(y_true, list(malignant_ids))
    pred_malignant = np.isin(y_pred, list(malignant_ids))

    tp = int(np.sum(true_malignant & pred_malignant))
    fn = int(np.sum(true_malignant & ~pred_malignant))
    tn = int(np.sum(~true_malignant & ~pred_malignant))
    fp = int(np.sum(~true_malignant & pred_malignant))

    return {
        "definition": (f"malignant = {MALIGNANT_GROUP} (grouped); benign = all "
                       "other classes"),
        "n_malignant": int(true_malignant.sum()),
        "n_benign": int((~true_malignant).sum()),
        "true_positive": tp,
        "false_negative": fn,
        "true_negative": tn,
        "false_positive": fp,
        "sensitivity_recall": float(tp / (tp + fn)) if (tp + fn) else float("nan"),
        "specificity": float(tn / (tn + fp)) if (tn + fp) else float("nan"),
        "missed_malignant_rate": float(fn / (tp + fn)) if (tp + fn) else float("nan"),
    }


def classification_text_report(report: Dict,
                              class_names: Sequence[str] = CLASS_NAMES) -> str:
    """Human-readable per-class table (ASCII, safe for logs and markdown)."""
    lines = [
        f"{'class':>8} | {'precision':>9} | {'recall':>6} | {'f1':>6} | "
        f"{'support':>7} | {'AUC':>5}",
        "-" * 58,
    ]
    for name in class_names:
        row = report["per_class"][name]
        auc = report["per_class_roc_auc"].get(name)
        auc_text = f"{auc:.3f}" if auc is not None else "n/a"
        lines.append(f"{name:>8} | {row['precision']:>9.3f} | {row['recall']:>6.3f} | "
                     f"{row['f1-score']:>6.3f} | {row['support']:>7d} | {auc_text:>5}")
    lines.append("-" * 58)
    lines.append(f"{'macro':>8} | {report['macro_precision']:>9.3f} | "
                 f"{report['macro_recall']:>6.3f} | {report['macro_f1']:>6.3f} |")
    lines.append(
        f"accuracy={report['accuracy']:.4f}  "
        f"balanced_accuracy={report['balanced_accuracy']:.4f}  "
        f"top3={report['top3_accuracy']:.4f}  "
        f"kappa={report['cohen_kappa']:.4f}  "
        f"macroAUC={report['macro_roc_auc_ovr']:.4f}"
        if report["macro_roc_auc_ovr"] is not None else "")
    return "\n".join(lines)


# ===========================================================================
# 3. Report writing
# ===========================================================================

def evaluate_model(
    model: tf.keras.Model,
    split: str = "test",
    use_tta: bool = USE_TTA,
    batch_size: int = config.BATCH_SIZE,
) -> Dict:
    """Evaluate *model* on one split and return the full metric dictionary.

    ``split`` is ``"test"`` (the number that is reported) or ``"val"`` (useful
    for sanity checks).  The dataset is **never** augmented here.
    """
    train_df, val_df, test_df = preprocessing.load_manifests()
    frames = {"train": train_df, "val": val_df, "test": test_df}
    if split not in frames:
        raise ValueError(f"split must be one of {list(frames)}, got '{split}'")

    df = frames[split]
    print(f"\n[Eval] Split '{split}': {len(df)} images "
          f"({df['lesion_id'].nunique()} distinct lesions)")
    ds = preprocessing._make_dataset(df, augment=False, batch_size=batch_size,
                                     shuffle=False)

    probs, y_true = predict_probabilities(model, ds, use_tta=use_tta)
    report = compute_metrics(probs, y_true)
    report["split"] = split
    report["tta"] = bool(use_tta)
    report["batch_size"] = int(batch_size)
    report["screening_malignant_vs_benign"] = malignant_screening_block(
        y_true, report["_y_pred"]
    )
    return report


def write_reports(
    report: Dict,
    out_dir: Path = ARTIFACTS_DIR / "evaluation",
    class_names: Sequence[str] = CLASS_NAMES,
) -> Tuple[Dict, Dict[str, Path]]:
    """Render every figure/JSON for a metric dictionary.

    Returns ``(cleaned_report, paths)`` — the private numpy keys used for
    plotting are stripped from the JSON payload.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    split = report.get("split", "test")
    cm = np.asarray(report["confusion_matrix"], dtype=float)

    paths: Dict[str, Path] = {}
    paths["confusion_matrix"] = plot_confusion_matrix(
        cm, class_names, out_dir / f"confusion_matrix_{split}.png",
        normalize=False,
        title=f"Confusion matrix - {split} (n={report['n_images']})",
    )
    paths["confusion_matrix_normalized"] = plot_confusion_matrix(
        cm, class_names, out_dir / f"confusion_matrix_{split}_normalized.png",
        normalize=True,
        title=f"Row-normalised confusion matrix - {split}",
    )
    paths["per_class_metrics"] = plot_per_class_metrics(
        report["per_class"], class_names, out_dir / f"per_class_metrics_{split}.png"
    )

    # One-vs-rest ROC curves
    y_true = report.get("_y_true")
    probs = report.get("_probs")
    if y_true is not None and probs is not None:
        per_class_roc: Dict[str, Dict[str, object]] = {}
        for i, name in enumerate(class_names):
            binary = (y_true == i).astype(int)
            if binary.min() == binary.max():
                continue
            fpr, tpr, _ = roc_curve(binary, probs[:, i])
            per_class_roc[name] = {
                "fpr": np.round(fpr, 5).tolist(),
                "tpr": np.round(tpr, 5).tolist(),
                "auc": report["per_class_roc_auc"][name],
            }
        macro_auc = report["macro_roc_auc_ovr"] or 0.0
        paths["roc_curves"] = plot_roc_curves(
            per_class_roc, out_dir / f"roc_curves_{split}.png", macro_auc
        )
        report["roc_curves"] = per_class_roc

    clean = {k: v for k, v in report.items() if not k.startswith("_")}
    json_path = out_dir / f"{split}_report.json"
    with open(json_path, "w", encoding="utf-8") as fh:
        json.dump(clean, fh, indent=2, default=str)
    paths["json"] = json_path
    print(f"[Eval] Wrote {json_path}")
    return clean, paths


# ===========================================================================
# 4. CLI
# ===========================================================================

def apply_malignant_referral(
    probs: np.ndarray, malignant_idx: List[int], threshold: float
) -> np.ndarray:
    """Apply the frozen malignant-referral operating point.

    If ``p(mel) + p(bcc) + p(akiec) >= threshold`` predict the argmax
    *within* the malignant group (flag for review); otherwise argmax overall.
    Deterministic post-processing of frozen softmax outputs — no retraining.
    """
    argmax = np.argmax(probs, axis=1)
    out = argmax.copy()
    refer = probs[:, malignant_idx].sum(axis=1) >= threshold
    if np.any(refer):
        local = np.argmax(probs[np.ix_(refer, malignant_idx)], axis=1)
        out[refer] = np.asarray(malignant_idx)[local]
    return out


def referral_screening_report(
    y_true: np.ndarray,
    y_argmax: np.ndarray,
    y_referral: np.ndarray,
    class_names: Sequence[str],
    threshold: float,
) -> Dict:
    """Compare argmax vs frozen-threshold referral on the same predictions."""
    base = malignant_screening_block(y_true, y_argmax, class_names)
    re = malignant_screening_block(y_true, y_referral, class_names)

    def prf(y_pred: np.ndarray) -> Dict:
        labels = list(range(len(class_names)))
        p, r, f1, sup = precision_recall_fscore_support(
            y_true, y_pred, labels=labels, zero_division=0
        )
        return {
            class_names[i]: {
                "precision": float(p[i]),
                "recall": float(r[i]),
                "f1-score": float(f1[i]),
                "support": int(sup[i]),
            }
            for i in range(len(class_names))
        }

    per_base = prf(y_argmax)
    per_re = prf(y_referral)
    targets = [c for c in HIGH_RECALL_CLASSES + ["akiec"] if c in class_names]
    return {
        "threshold_source": "validation only (val_threshold_sweep.json); "
                            "NOT re-tuned on test",
        "referral_threshold": float(threshold),
        "rule": "if p(mel)+p(bcc)+p(akiec) >= t predict argmax within "
                "{mel,bcc,akiec}, else argmax overall",
        "argmax_screening": base,
        "referral_screening": re,
        "delta_sensitivity": re["sensitivity_recall"] - base["sensitivity_recall"],
        "delta_specificity": re["specificity"] - base["specificity"],
        "per_class_argmax": {c: per_base[c] for c in targets},
        "per_class_referral": {c: per_re[c] for c in targets},
        "accuracy_argmax": float(accuracy_score(y_true, y_argmax)),
        "accuracy_referral": float(accuracy_score(y_true, y_referral)),
        "balanced_accuracy_argmax": float(
            balanced_accuracy_score(y_true, y_argmax)),
        "balanced_accuracy_referral": float(
            balanced_accuracy_score(y_true, y_referral)),
    }


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate the frozen MediMinds Skin Sense model."
    )
    parser.add_argument("--model", default=str(BEST_MODEL_PATH),
                        help="Path to the .keras model to evaluate.")
    parser.add_argument("--split", default="test", choices=["val", "test"],
                        help="Which split to evaluate (default: test).")
    parser.add_argument("--no-tta", dest="use_tta", action="store_false",
                        help="Disable flip test-time augmentation.")
    parser.add_argument("--out-dir", default=str(ARTIFACTS_DIR / "evaluation"),
                        help="Directory for plots and the JSON report.")
    parser.add_argument("--batch-size", type=int, default=config.BATCH_SIZE)
    parser.add_argument("--referral-threshold", type=float, default=None,
                        help="Frozen malignant-referral threshold selected on VAL "
                             "(e.g. 0.35). When set, the run ALSO writes a "
                             "separate *_referral_*.json comparing argmax vs "
                             "referral on the SAME predictions. The threshold is "
                             "never tuned here; the default None keeps the "
                             "original argmax-only behaviour (test_report.json "
                             "unchanged).")
    return parser.parse_args(argv)


def run_frozen_referral_on_split(
    probs: np.ndarray,
    y_true: np.ndarray,
    threshold: float,
    split: str,
    model_path: Path,
    use_tta: bool,
    out_dir: Path,
    argmax_pred: np.ndarray,
    class_names: Sequence[str] = CLASS_NAMES,
) -> Tuple[Dict, Path]:
    """Apply frozen VAL threshold t to test/val probs; write separate JSON."""
    mal_idx = [list(class_names).index(n) for n in MALIGNANT_GROUP]
    y_ref = apply_malignant_referral(probs, mal_idx, float(threshold))
    comp = referral_screening_report(
        y_true, np.asarray(argmax_pred), y_ref, list(class_names),
        float(threshold))
    comp.update({"split": split, "model": str(model_path),
                 "tta": bool(use_tta), "disclaimer": config.DISCLAIMER})
    rp = out_dir / f"{split}_referral_t{float(threshold):g}.json"
    with open(rp, "w", encoding="utf-8") as fh:
        json.dump(comp, fh, indent=2, default=str)
    return comp, rp


def main(argv=None) -> Dict:
    args = parse_args(argv)
    tf.keras.utils.set_random_seed(SEED)

    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}\nTrain one first with "
            "`python -m ml.src.train`."
        )

    print("=" * 72)
    print("  MediMinds Skin Sense - evaluation")
    print("=" * 72)
    print(f"  model  : {model_path}")
    print(f"  split  : {args.split}")
    print(f"  TTA    : {'on (4 flip views)' if args.use_tta else 'off'}")
    print("-" * 72)

    model = model_lib.load_trained_model(model_path, compile_model_flag=False)
    report = evaluate_model(model, split=args.split, use_tta=args.use_tta,
                            batch_size=args.batch_size)
    clean, paths = write_reports(report, Path(args.out_dir))

    print("\n" + classification_text_report(report))

    if args.referral_threshold is not None:
        t = float(args.referral_threshold)
        print(f"\n[Frozen referral] threshold={t} "
              f"(selected on VAL only, NOT re-tuned on {args.split})")
        _comp, _rp = run_frozen_referral_on_split(
            np.asarray(report["_probs"]), np.asarray(report["_y_true"]), t,
            args.split, model_path, args.use_tta, Path(args.out_dir),
            np.asarray(report["_y_pred"]))
        paths["referral_json"] = _rp
        print(f"[Frozen referral] Wrote {_rp}")
        _a = _comp["argmax_screening"]
        _r = _comp["referral_screening"]
        print(f"  argmax   : sens={_a['sensitivity_recall']:.4f} "
              f"spec={_a['specificity']:.4f} "
              f"missed={_a['false_negative']}/{_a['n_malignant']} "
              f"({ _a['missed_malignant_rate'] * 100:.1f}%)")
        print(f"  referral : sens={_r['sensitivity_recall']:.4f} "
              f"spec={_r['specificity']:.4f} "
              f"missed={_r['false_negative']}/{_r['n_malignant']} "
              f"({ _r['missed_malignant_rate'] * 100:.1f}%)")
        for _c in _comp["per_class_referral"]:
            _b = _comp["per_class_argmax"][_c]
            _n = _comp["per_class_referral"][_c]
            print(f"    {_c}: argmax R={_b['recall']:.3f}/P={_b['precision']:.3f} "
                  f"-> referral R={_n['recall']:.3f}/P={_n['precision']:.3f}")
    screening = clean["screening_malignant_vs_benign"]
    print(f"\nScreening block ({screening['definition']})")
    print(f"  sensitivity (malignant) : {screening['sensitivity_recall']:.4f}")
    print(f"  specificity             : {screening['specificity']:.4f}")
    print(f"  missed malignant        : {screening['false_negative']} of "
          f"{screening['n_malignant']} "
          f"({screening['missed_malignant_rate'] * 100:.1f}%)")
    print("\nHigh-recall classes (clinically critical):")
    for name, values in clean["high_recall_classes"].items():
        print(f"  {name}: recall={values['recall']:.4f} "
              f"(support {values['support']})")

    print("\nFigures written:")
    for key, path in paths.items():
        print(f"  {key:<26}{path}")
    print(f"\n{config.DISCLAIMER}")
    print("=" * 72)
    return clean


if __name__ == "__main__":
    main()



