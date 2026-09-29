"""Val-only threshold sweep for the frozen model. NEVER touches test.
Rules: (A) single-class override p(target)>=t else argmax, for mel/akiec/bcc;
(B) malignant referral sum(p mel,bcc,akiec)>=t then argmax within malignant.
Ranked by F2 with guards: nv-precision drop<=0.05, acc drop<=0.04.
Run: python -m ml.src.threshold_tuning. Out: evaluation/val_threshold_sweep.json + 2 PNGs.
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from typing import Dict, List
sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
import config
import runtime
runtime.configure()
import tensorflow as tf  # noqa: E402
from sklearn.metrics import accuracy_score, balanced_accuracy_score, precision_recall_fscore_support  # noqa: E402
import model as model_lib  # noqa: E402
import preprocessing  # noqa: E402
from config import ARTIFACTS_DIR, BEST_MODEL_PATH, CLASS_NAMES, DISCLAIMER, SEED, USE_TTA  # noqa: E402
from evaluate import MALIGNANT_GROUP, malignant_screening_block, predict_probabilities  # noqa: E402
SINGLE_THRESHOLDS = [round(x, 2) for x in np.arange(0.10, 0.71, 0.05)]
REFERRAL_THRESHOLDS = [round(x, 2) for x in np.arange(0.15, 0.86, 0.05)]
TARGET_CLASSES = ["mel", "akiec", "bcc"]
MAX_NV_PRECISION_DROP = 0.05
MAX_ACCURACY_DROP = 0.04
BETA = 2.0
def fbeta(precision: float, recall: float, beta: float = BETA) -> float:
    if precision + recall <= 0:
        return 0.0
    b2 = beta * beta
    return (1 + b2) * precision * recall / (b2 * precision + recall)


def baseline_metrics(y_true: np.ndarray, y_pred: np.ndarray, class_names=CLASS_NAMES) -> Dict:
    labels = list(range(len(class_names)))
    p, r, f1, sup = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=0)
    per_class = {name: {"precision": float(p[i]), "recall": float(r[i]), "f1-score": float(f1[i]), "support": int(sup[i])} for i, name in enumerate(class_names)}
    screen = malignant_screening_block(y_true, y_pred, class_names)
    return {"accuracy": float(accuracy_score(y_true, y_pred)), "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)), "per_class": per_class, "screening": screen}


def apply_single_override(probs: np.ndarray, target_idx: int, threshold: float) -> np.ndarray:
    argmax = np.argmax(probs, axis=1)
    out = argmax.copy()
    out[probs[:, target_idx] >= threshold] = target_idx
    return out


def apply_malignant_referral(probs: np.ndarray, malignant_idx: List[int], threshold: float) -> np.ndarray:
    argmax = np.argmax(probs, axis=1)
    refer = probs[:, malignant_idx].sum(axis=1) >= threshold
    out = argmax.copy()
    if np.any(refer):
        local = np.argmax(probs[np.ix_(refer, malignant_idx)], axis=1)
        out[refer] = np.array(malignant_idx)[local]
    return out


def sweep_val(probs: np.ndarray, y_true: np.ndarray, class_names=CLASS_NAMES) -> Dict:
    index = {n: i for i, n in enumerate(class_names)}
    malignant_idx = [index[n] for n in MALIGNANT_GROUP if n in index]
    y_base = np.argmax(probs, axis=1)
    base = baseline_metrics(y_true, y_base, class_names)
    base_nv_p = base["per_class"]["nv"]["precision"]
    base_acc = base["accuracy"]
    single_rows: List[Dict] = []
    for target in TARGET_CLASSES:
        t_idx = index[target]
        for t in SINGLE_THRESHOLDS:
            y_pred = apply_single_override(probs, t_idx, t)
            m = baseline_metrics(y_true, y_pred, class_names)
            pc = m["per_class"][target]
            single_rows.append({"rule": "single_override", "target": target, "threshold": t, "target_precision": pc["precision"], "target_recall": pc["recall"], "target_f1": pc["f1-score"], "target_f2": fbeta(pc["precision"], pc["recall"]), "accuracy": m["accuracy"], "balanced_accuracy": m["balanced_accuracy"], "nv_precision": m["per_class"]["nv"]["precision"], "nv_recall": m["per_class"]["nv"]["recall"], "sensitivity_malignant": m["screening"]["sensitivity_recall"], "specificity": m["screening"]["specificity"]})
    referral_rows: List[Dict] = []
    for t in REFERRAL_THRESHOLDS:
        y_pred = apply_malignant_referral(probs, malignant_idx, t)
        m = baseline_metrics(y_true, y_pred, class_names)
        referral_rows.append({"rule": "malignant_referral", "threshold": t, "accuracy": m["accuracy"], "balanced_accuracy": m["balanced_accuracy"], "sensitivity_malignant": m["screening"]["sensitivity_recall"], "specificity": m["screening"]["specificity"], "mel_recall": m["per_class"]["mel"]["recall"], "akiec_recall": m["per_class"]["akiec"]["recall"], "bcc_recall": m["per_class"]["bcc"]["recall"], "nv_precision": m["per_class"]["nv"]["precision"], "mel_precision": m["per_class"]["mel"]["precision"], "akiec_precision": m["per_class"]["akiec"]["precision"]})
    def passes(r: Dict) -> bool:
        return (r.get("nv_precision", 1.0) >= base_nv_p - MAX_NV_PRECISION_DROP) and (r.get("accuracy", 0.0) >= base_acc - MAX_ACCURACY_DROP)
    recs: Dict[str, Dict] = {}
    for target in TARGET_CLASSES:
        cands = [x for x in single_rows if x["target"] == target and passes(x)]
        pool = cands if cands else [x for x in single_rows if x["target"] == target]
        best = max(pool, key=lambda x: (x["target_f2"], x["target_recall"]))
        recs[f"{target}_override"] = {**best, "guard_passed": bool(passes(best))}
    ok = [x for x in referral_rows if x["specificity"] >= 0.80 and passes(x)]
    best_ref = max(ok, key=lambda x: x["sensitivity_malignant"]) if ok else max(referral_rows, key=lambda x: fbeta(x["specificity"], x["sensitivity_malignant"]))
    recs["malignant_referral"] = {**best_ref, "guard_passed": bool(passes(best_ref))}
    return {"baseline_argmax": {"accuracy": base["accuracy"], "balanced_accuracy": base["balanced_accuracy"], "per_class": base["per_class"], "screening": base["screening"]}, "single_override_sweep": single_rows, "referral_sweep": referral_rows, "recommendations": recs}
def plot_sweeps(sweep: Dict, out_dir: Path) -> Dict[str, Path]:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: Dict[str, Path] = {}
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.2), sharex=True)
    for ax, target in zip(axes, TARGET_CLASSES):
        rows = [r for r in sweep["single_override_sweep"] if r["target"] == target]
        ts = [r["threshold"] for r in rows]
        ax.plot(ts, [r["target_recall"] for r in rows], marker="o", label=f"{target} recall")
        ax.plot(ts, [r["target_precision"] for r in rows], marker="s", label=f"{target} precision")
        ax.plot(ts, [r["nv_precision"] for r in rows], linestyle="--", label="nv precision")
        rec = sweep["recommendations"][f"{target}_override"]
        ax.axvline(rec["threshold"], color="red", linestyle=":", label=f"pick {rec['threshold']}")
        ax.set_title(f"single override: {target} (VAL)")
        ax.set_xlabel("threshold"); ax.set_ylabel("score"); ax.set_ylim(0, 1.02)
        ax.grid(alpha=0.3); ax.legend(fontsize=7)
    fig.tight_layout()
    p1 = out_dir / "val_threshold_sweep_single.png"
    fig.savefig(p1, dpi=150, bbox_inches="tight"); plt.close(fig)
    paths["single"] = p1; print(f"[Threshold] Saved {p1}")
    ref = sweep["referral_sweep"]
    ts = [r["threshold"] for r in ref]
    fig2, ax2 = plt.subplots(figsize=(6.6, 4.6))
    ax2.plot(ts, [r["sensitivity_malignant"] for r in ref], marker="o", label="sensitivity malignant")
    ax2.plot(ts, [r["specificity"] for r in ref], marker="s", label="specificity")
    ax2.plot(ts, [r["accuracy"] for r in ref], linestyle="--", label="accuracy")
    best = sweep["recommendations"]["malignant_referral"]
    ax2.axvline(best["threshold"], color="red", linestyle=":", label=f"pick {best['threshold']}")
    ax2.set(title="Malignant referral sweep (VAL ONLY)", xlabel="p(mel)+p(bcc)+p(akiec) threshold", ylabel="score")
    ax2.set_ylim(0, 1.02); ax2.grid(alpha=0.3); ax2.legend(fontsize=8)
    fig2.tight_layout()
    p2 = out_dir / "val_threshold_sweep_malignant.png"
    fig2.savefig(p2, dpi=150, bbox_inches="tight"); plt.close(fig2)
    paths["malignant"] = p2; print(f"[Threshold] Saved {p2}")
    return paths


def parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Val-only threshold sweep (never test).")
    p.add_argument("--model", default=str(BEST_MODEL_PATH))
    p.add_argument("--no-tta", dest="use_tta", action="store_false")
    p.add_argument("--out-dir", default=str(ARTIFACTS_DIR / "evaluation"))
    p.add_argument("--batch-size", type=int, default=config.BATCH_SIZE)
    return p.parse_args(argv)


def main(argv=None) -> Dict:
    args = parse_args(argv)
    tf.keras.utils.set_random_seed(SEED)
    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    print("=" * 72)
    print("  VAL-ONLY threshold sweep (test never loaded)")
    print(f"  model: {model_path} | TTA: {args.use_tta}")
    print("=" * 72)
    train_df, val_df, _test_df = preprocessing.load_manifests()
    del train_df, _test_df
    print(f"[Threshold] Val: {len(val_df)} images ({val_df['lesion_id'].nunique()} lesions)")
    ds = preprocessing._make_dataset(val_df, augment=False, batch_size=args.batch_size, shuffle=False)
    model = model_lib.load_trained_model(model_path, compile_model_flag=False)
    probs, y_true = predict_probabilities(model, ds, use_tta=args.use_tta)
    sweep = sweep_val(probs, y_true, list(CLASS_NAMES))
    sweep["meta"] = {"split": "val", "tta": bool(args.use_tta), "model": str(model_path), "n_images": int(len(y_true)), "grids": {"single": SINGLE_THRESHOLDS, "referral": REFERRAL_THRESHOLDS}, "guards": {"max_nv_precision_drop": MAX_NV_PRECISION_DROP, "max_accuracy_drop": MAX_ACCURACY_DROP}, "note": "Test NOT loaded.", "disclaimer": DISCLAIMER}
    out_dir = Path(args.out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    pp = plot_sweeps(sweep, out_dir)
    jp = out_dir / "val_threshold_sweep.json"
    with open(jp, "w", encoding="utf-8") as fh:
        json.dump(sweep, fh, indent=2, default=str)
    print(f"[Threshold] Wrote {jp}")
    base = sweep["baseline_argmax"]
    print(f"\nVAL argmax: acc={base['accuracy']:.4f} bal={base['balanced_accuracy']:.4f} sens={base['screening']['sensitivity_recall']:.4f} spec={base['screening']['specificity']:.4f}")
    for k, rec in sweep["recommendations"].items():
        print(f"  {k}: t={rec['threshold']} guard={rec['guard_passed']} | {str({kk: round(v, 3) if isinstance(v, float) else v for kk, v in rec.items() if kk in ('target_recall', 'target_precision', 'target_f2', 'sensitivity_malignant', 'specificity', 'accuracy', 'mel_recall', 'akiec_recall')})}")
    print(f"\n{DISCLAIMER}")
    sweep["paths"] = {k: str(v) for k, v in pp.items()}; sweep["paths"]["json"] = str(jp)
    return sweep


if __name__ == "__main__":
    main()
