"""
Two-stage transfer-learning loop for the MediMinds Skin Sense classifier.

Stage 1 — **head only** (``STAGE1_EPOCHS``, lr ``STAGE1_LR``)
    The ImageNet backbone is frozen and only the small classification head is
    trained.  This is fast on CPU (no backbone backpropagation) and quickly
    converges to a strong baseline.

Stage 2 — **fine-tuning** (``STAGE2_EPOCHS``, lr ``STAGE2_LR``)
    The upper backbone blocks (from ``FINE_TUNE_FROM``, default ``block6``) are
    unfrozen and trained with a much smaller learning rate.  BatchNorm layers
    stay frozen.  Stage 2 starts from the *best* stage-1 checkpoint, not from the
    last epoch, so a noisy epoch-1 overfit cannot poison fine-tuning.

Safety rails
------------
* ``ModelCheckpoint`` (``MONITOR``, default val_accuracy) keeps the best epoch.
* ``EarlyStopping`` restores the best weights when the monitor stalls.
* ``ReduceLROnPlateau`` halves/thirds the LR when ``val_loss`` plateaus.
* ``OverfitWatchdog`` records the train-val accuracy gap every epoch, prints a
  loud warning when it stays above ``OVERFIT_GAP_WARN`` and writes
  ``artifacts/overfitting_report.json``.
* ``TerminateOnNaN`` aborts a diverged run instead of writing a broken model.

Usage
-----
    python -m ml.src.train                  # full two-stage run
    python -m ml.src.train --stage 1        # head-only stage
    python -m ml.src.train --smoke          # ~2 min end-to-end smoke test
    python -m ml.src.train --loss focal --epochs-stage2 8
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

# Ensure this directory (src/) is on sys.path so `import config` works whether
# the module is imported as a package or executed as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np

import config
import runtime                      # exports the TF thread env vars

runtime.configure()

# NOTE: TensorFlow must be imported *after* runtime.configure() so that the
# tuned thread counts are picked up by TF's thread pools.
import tensorflow as tf             # noqa: E402

import model as model_lib           # noqa: E402
import preprocessing                # noqa: E402
from config import (                # noqa: E402
    ARTIFACTS_DIR, BACKBONE, BATCH_SIZE, BEST_MODEL_PATH, CLASS_NAMES,
    DISCLAIMER, EARLY_STOP_PATIENCE, FINE_TUNE_FROM, HISTORY_PATH, IMAGE_SIZE,
    LABEL_MAP_PATH, LOG_CSV_PATH, LOSS, MIN_LR, MONITOR, MONITOR_MODE,
    OVERFIT_GAP_WARN, OVERFIT_PATIENCE, OVERFIT_REPORT_PATH, REDUCE_LR_FACTOR,
    REDUCE_LR_PATIENCE, RUN_INFO_PATH, SEED, STAGE1_EPOCHS, STAGE1_LR,
    STAGE1_MODEL_PATH, STAGE2_EPOCHS, STAGE2_LR, STAGE2_MODEL_PATH,
)
from plots import plot_training_curves


# ===========================================================================
# 1. Callbacks
# ===========================================================================

class OverfitWatchdog(tf.keras.callbacks.Callback):
    """Track the train/validation gap and warn when the model starts memorising.

    A model that keeps improving on the training split while validation stalls is
    overfitting.  The watchdog records every epoch, prints a warning once the gap
    exceeds ``gap_threshold`` for ``patience`` consecutive epochs, and exposes the
    records so they can be persisted to ``overfitting_report.json``.
    """

    def __init__(self, gap_threshold: float = OVERFIT_GAP_WARN,
                 patience: int = OVERFIT_PATIENCE, verbose: bool = True):
        super().__init__()
        self.gap_threshold = float(gap_threshold)
        self.patience = int(patience)
        self.verbose = verbose
        self.records: List[Dict[str, float]] = []
        self.warnings: List[str] = []
        self._consecutive = 0

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        train_acc = logs.get("accuracy")
        val_acc = logs.get("val_accuracy")
        if train_acc is None or val_acc is None:
            return

        gap = float(train_acc) - float(val_acc)
        self.records.append({
            "epoch": int(epoch) + 1,
            "train_accuracy": round(float(train_acc), 5),
            "val_accuracy": round(float(val_acc), 5),
            "accuracy_gap": round(gap, 5),
            "train_loss": round(float(logs.get("loss", float("nan"))), 5),
            "val_loss": round(float(logs.get("val_loss", float("nan"))), 5),
            "learning_rate": float(tf.keras.backend.get_value(self.model.optimizer.learning_rate)),
        })

        if gap > self.gap_threshold:
            self._consecutive += 1
        else:
            self._consecutive = 0

        if self._consecutive >= self.patience:
            message = (
                f"OVERFITTING WARNING (epoch {int(epoch) + 1}): train-minus-val "
                f"accuracy gap = {gap:.3f} > {self.gap_threshold:.2f} for "
                f"{self._consecutive} consecutive epochs. Consider fewer "
                f"fine-tuned blocks, more augmentation/dropout, or stopping early."
            )
            self.warnings.append(message)
            if self.verbose:
                print(f"\n[!] {message}\n")

    def summary(self) -> Dict:
        """Machine-readable overfitting report."""
        gaps = [r["accuracy_gap"] for r in self.records]
        best = max(self.records, key=lambda r: r["val_accuracy"], default=None)
        return {
            "gap_threshold": self.gap_threshold,
            "patience": self.patience,
            "epochs_recorded": len(self.records),
            "max_accuracy_gap": round(max(gaps), 5) if gaps else None,
            "final_accuracy_gap": round(gaps[-1], 5) if gaps else None,
            "best_val_accuracy": best["val_accuracy"] if best else None,
            "best_val_epoch": best["epoch"] if best else None,
            "warnings": self.warnings,
            "per_epoch": self.records,
        }


class EpochTimer(tf.keras.callbacks.Callback):
    """Record per-epoch wall-clock time (useful when reporting CPU runtimes)."""

    def __init__(self):
        super().__init__()
        self.seconds: List[float] = []
        self._start: float = 0.0

    def on_epoch_begin(self, epoch, logs=None):
        self._start = time.time()

    def on_epoch_end(self, epoch, logs=None):
        elapsed = time.time() - self._start
        self.seconds.append(round(elapsed, 1))
        print(f"        epoch {int(epoch) + 1} took {elapsed:.1f}s")


def make_callbacks(
    checkpoint_path: Path,
    stage_label: str,
    watchdog: OverfitWatchdog,
    timer: EpochTimer,
    append_csv: bool,
    monitor: str = MONITOR,
    mode: str = MONITOR_MODE,
    log_csv: Path = LOG_CSV_PATH,
) -> List[tf.keras.callbacks.Callback]:
    """Assemble the callback stack for one training stage."""
    return [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(checkpoint_path),
            monitor=monitor,
            mode=mode,
            save_best_only=True,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor=monitor,
            mode=mode,
            patience=EARLY_STOP_PATIENCE,
            restore_best_weights=True,
            verbose=1,
        ),
        # The LR schedule follows the smoother val_loss signal while model
        # selection follows val_accuracy — a standard, well-behaved pairing.
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            mode="min",
            factor=REDUCE_LR_FACTOR,
            patience=REDUCE_LR_PATIENCE,
            min_lr=MIN_LR,
            verbose=1,
        ),
        tf.keras.callbacks.CSVLogger(str(log_csv), append=append_csv),
        tf.keras.callbacks.TerminateOnNaN(),
        watchdog,
        timer,
    ]


# ===========================================================================
# 2. CLI + environment reporting
# ===========================================================================

def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Two-stage transfer-learning training for MediMinds Skin Sense."
    )
    parser.add_argument("--stage", choices=["1", "2", "both"], default="both",
                        help="Which stage(s) to run (default: both).")
    parser.add_argument("--epochs-stage1", type=int, default=STAGE1_EPOCHS)
    parser.add_argument("--epochs-stage2", type=int, default=STAGE2_EPOCHS)
    parser.add_argument("--lr-stage1", type=float, default=STAGE1_LR)
    parser.add_argument("--lr-stage2", type=float, default=STAGE2_LR)
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--loss", default=LOSS,
                        choices=["weighted_ce", "ce", "focal"],
                        help="Objective: weighted_ce uses fit(class_weight=...).")
    parser.add_argument("--fine-tune-from", default=FINE_TUNE_FROM,
                        help="First backbone block to unfreeze in stage 2.")
    parser.add_argument("--verbose", type=int, default=2, choices=[0, 1, 2])
    parser.add_argument("--smoke", action="store_true",
                        help="Tiny stratified subset, 2+1 epochs — validates the "
                             "whole pipeline in a couple of minutes.")
    parser.add_argument("--fresh-log", action="store_true",
                        help="Truncate training_log.csv instead of appending.")
    return parser.parse_args(argv)


def _print_environment() -> Dict:
    """Print and return a short environment description for run_info.json."""
    gpus = [d.name for d in tf.config.list_physical_devices("GPU")]
    cpus = [d.name for d in tf.config.list_physical_devices("CPU")]
    env = {
        "tensorflow": tf.__version__,
        "keras": tf.keras.__version__,
        "python": sys.version.split()[0],
        "gpus": gpus,
        "cpu_devices": cpus,
        "backbone": BACKBONE,
        "image_size": list(IMAGE_SIZE),
        "batch_size": BATCH_SIZE,
        "mixed_precision_policy": tf.keras.mixed_precision.global_policy().name,
    }
    print("=" * 72)
    print("  MediMinds Skin Sense - training")
    print("=" * 72)
    for key in ("tensorflow", "keras", "python", "backbone", "image_size"):
        print(f"  {key:<24}{env[key]}")
    print(f"  {'accelerators':<24}{gpus if gpus else 'none (CPU-only run)'}")
    print(f"  {'cpu devices':<24}{len(cpus)}")
    print("-" * 72)
    print(f"  {DISCLAIMER}")
    print("=" * 72)
    return env


# ===========================================================================
# 3. Stage runner
# ===========================================================================

def run_stage(
    model: tf.keras.Model,
    train_ds: tf.data.Dataset,
    val_ds: tf.data.Dataset,
    stage_label: str,
    epochs: int,
    learning_rate: float,
    class_weight: Optional[Dict[int, float]],
    checkpoint_path: Path,
    append_csv: bool,
    loss_name: str = LOSS,
    verbose: int = 2,
    log_csv: Path = LOG_CSV_PATH,
):
    """Compile and train a single stage, then restore its best epoch.

    Returns ``(history_dict, watchdog, timer, elapsed_seconds)``.
    """
    print("\n" + "=" * 72)
    print(f"  {stage_label}")
    print(f"  epochs={epochs}  lr={learning_rate}  loss={loss_name}  "
          f"class_weight={'on' if class_weight else 'off'}")
    print("=" * 72)

    model_lib.compile_model(model, learning_rate, loss_name=loss_name)
    if not model_lib.uses_class_weights(loss_name) and class_weight:
        print("[Train] NOTE: focal loss ignores class weights (uses its own alpha).")

    watchdog = OverfitWatchdog()
    timer = EpochTimer()
    callbacks = make_callbacks(checkpoint_path, stage_label, watchdog, timer,
                               append_csv, log_csv=log_csv)

    started = time.time()
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=verbose,
    )
    elapsed = time.time() - started

    # Continue from the *best* epoch of this stage rather than the last one.
    if Path(checkpoint_path).exists():
        try:
            model.load_weights(str(checkpoint_path))
            print(f"[Train] Restored best epoch of '{stage_label}' from "
                  f"{checkpoint_path}")
        except Exception as exc:                       # noqa: BLE001
            print(f"[Train] WARNING: could not reload the checkpoint ({exc}); "
                  "continuing from the last epoch.")

    best_val = max(history.history.get("val_accuracy", [0.0]))
    print(f"[Train] {stage_label} finished in {elapsed / 60:.1f} min "
          f"({elapsed / max(1, len(history.history.get('loss', []))):.1f} s/epoch); "
          f"best val_accuracy seen = {best_val:.4f}")
    return history.history, watchdog, timer, elapsed


def evaluate_dataset(model: tf.keras.Model, ds: tf.data.Dataset) -> Dict[str, float]:
    """Loss / top-1 / top-3 accuracy of *model* on a ``(images, labels)`` dataset."""
    values = model.evaluate(ds, verbose=0, return_dict=True)
    return {k: float(v) for k, v in values.items()}


def _json_dump(path: Path, payload) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, default=str)
    print(f"[Train] Wrote {path}")


def select_best_checkpoint(
    stage1_val: float,
    stage2_val: Optional[float],
    stage1_path: Path = STAGE1_MODEL_PATH,
    stage2_path: Path = STAGE2_MODEL_PATH,
    best_path: Path = BEST_MODEL_PATH,
) -> Path:
    """Copy the better of the two stage checkpoints to ``best_model.keras``.

    Fine-tuning almost always wins, but on a small/rare validation split it can
    regress; in that case the head-only checkpoint is the honest best model.
    """
    use_stage2 = stage2_val is not None and stage2_val >= stage1_val
    source = Path(stage2_path if use_stage2 else stage1_path)
    if not source.exists():
        raise FileNotFoundError(f"Neither stage produced a checkpoint ({source}).")
    best_path = Path(best_path)
    best_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, best_path)
    print(f"[Train] Best checkpoint: {'stage 2 (fine-tuned)' if use_stage2 else 'stage 1 (head)'} "
          f"-> {best_path}  (val_accuracy "
          f"{stage2_val if use_stage2 else stage1_val:.4f})")
    return best_path


def _artifact_paths(smoke: bool) -> Dict[str, Path]:
    """Where this run writes its outputs (a ``smoke/`` subdir for smoke tests)."""
    out_dir = (ARTIFACTS_DIR / "smoke") if smoke else ARTIFACTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    return {
        "dir": out_dir,
        "stage1": out_dir / "stage1_head.keras",
        "stage2": out_dir / "stage2_finetuned.keras",
        "best": out_dir / "best_model.keras",
        "history": out_dir / "training_history.json",
        "log_csv": out_dir / "training_log.csv",
        "run_info": out_dir / "run_info.json",
        "overfit": out_dir / "overfitting_report.json",
        "curves": out_dir / "training_curves.png",
        "label_map": out_dir / "label_map.json",
    }


def _build_datasets(args) -> tuple:
    """Training/validation datasets + metadata (never touches the test split)."""
    if not args.smoke:
        train_ds, val_ds, _test_ds, metadata = preprocessing.build_datasets(
            batch_size=args.batch_size
        )
        return train_ds, val_ds, metadata

    train_df, val_df, _test_df = preprocessing.load_manifests()
    train_df = train_df.groupby("label").head(15)     # stratified tiny subset
    val_df = val_df.groupby("label").head(5)
    print(f"[Smoke] Using {len(train_df)} train / {len(val_df)} val images, "
          "2 stage-1 epochs + 1 stage-2 epoch.")
    train_ds = preprocessing._make_dataset(train_df, augment=True,
                                          batch_size=min(args.batch_size, 16),
                                          shuffle=True)
    val_ds = preprocessing._make_dataset(val_df, augment=False,
                                        batch_size=min(args.batch_size, 16))
    metadata = {"class_weights": preprocessing.get_class_weights(train_df)}
    return train_ds, val_ds, metadata


# ===========================================================================
# 4. Entry point
# ===========================================================================

def main(argv=None) -> Dict:
    """Run the full two-stage training pipeline and write all artifacts."""
    args = parse_args(argv)
    tf.keras.utils.set_random_seed(SEED)
    np.random.seed(SEED)

    env = _print_environment()
    paths = _artifact_paths(args.smoke)
    if args.smoke:
        args.epochs_stage1, args.epochs_stage2 = 2, 1

    train_ds, val_ds, metadata = _build_datasets(args)

    if model_lib.uses_class_weights(args.loss):
        class_weight = metadata["class_weights"]
    else:
        class_weight = None
        print(f"[Train] Loss '{args.loss}' -> class_weight disabled "
              "(the objective handles imbalance itself).")

    model = model_lib.build_model(len(CLASS_NAMES), image_size=IMAGE_SIZE,
                                  backbone_name=BACKBONE)
    params = model_lib.trainable_parameter_summary(model)
    print(f"[Model] {BACKBONE}: {params['total']:,} parameters "
          f"({params['trainable']:,} trainable with the backbone frozen); "
          f"Grad-CAM target layer = {model_lib.find_last_conv_layer(model)}")

    histories: Dict[str, Dict] = {}
    timers: Dict[str, List[float]] = {}
    watchdogs: Dict[str, OverfitWatchdog] = {}
    seconds: Dict[str, float] = {}

    append_csv = not args.fresh_log
    stage1_val: Optional[float] = None
    stage2_val: Optional[float] = None

    if args.stage == "2":
        if Path(paths["stage1"]).exists():
            model.load_weights(str(paths["stage1"]))
            print(f"[Train] Continuing from existing head checkpoint "
                  f"{paths['stage1']}")
        else:
            print("[Train] WARNING: --stage 2 requested but no stage-1 checkpoint "
                  "exists; fine-tuning straight from the ImageNet head.")

    if args.stage in ("1", "both"):
        hist, watchdog, timer, elapsed = run_stage(
            model, train_ds, val_ds,
            "Stage 1/2 - head only (backbone frozen)",
            args.epochs_stage1, args.lr_stage1, class_weight,
            paths["stage1"], append_csv, args.loss, args.verbose, paths["log_csv"],
        )
        histories["stage1"] = hist
        watchdogs["stage1"] = watchdog
        timers["stage1"] = timer.seconds
        seconds["stage1"] = elapsed
        stage1_val = float(max(hist.get("val_accuracy", [0.0])))
        append_csv = True                       # stage 2 appends to the same CSV

    if args.stage in ("2", "both"):
        model_lib.unfreeze_backbone(model, from_block=args.fine_tune_from)
        hist, watchdog, timer, elapsed = run_stage(
            model, train_ds, val_ds,
            f"Stage 2/2 - fine-tuning from '{args.fine_tune_from}'",
            args.epochs_stage2, args.lr_stage2, class_weight,
            paths["stage2"], append_csv, args.loss, args.verbose, paths["log_csv"],
        )
        histories["stage2"] = hist
        watchdogs["stage2"] = watchdog
        timers["stage2"] = timer.seconds
        seconds["stage2"] = elapsed
        stage2_val = float(max(hist.get("val_accuracy", [0.0])))

    # The test split is intentionally never touched here — see ml/src/evaluate.py.
    return _finish(args, env, paths, model, val_ds, histories, timers, watchdogs,
                   seconds, stage1_val, stage2_val)


def _finish(args, env, paths, model, val_ds, histories, timers, watchdogs, seconds,
            stage1_val, stage2_val) -> Dict:
    """Select the best checkpoint, re-measure it honestly, and write all reports."""
    best_path = select_best_checkpoint(
        stage1_val if stage1_val is not None else float("-inf"),
        stage2_val, paths["stage1"], paths["stage2"], paths["best"],
    )
    best_model = model_lib.load_trained_model(best_path, compile_model_flag=True)
    val_metrics = evaluate_dataset(best_model, val_ds)
    print(f"[Train] Best-model validation: accuracy="
          f"{val_metrics.get('accuracy', float('nan')):.4f}, "
          f"top-3={val_metrics.get('top3_accuracy', float('nan')):.4f}, "
          f"loss={val_metrics.get('loss', float('nan')):.4f}")

    _json_dump(paths["history"], {
        "stage1": histories.get("stage1", {}),
        "stage2": histories.get("stage2", {}),
        "seconds_per_epoch": timers,
        "stage_seconds": seconds,
    })

    stage_labels = [f"Stage {i + 1}" for i in range(len(histories))]
    plot_training_curves(list(histories.values()), paths["curves"], stage_labels)

    overfit_reports = {name: watchdog.summary() for name, watchdog in watchdogs.items()}
    _json_dump(paths["overfit"], overfit_reports)
    for name, report in overfit_reports.items():
        print(f"[Overfit] {name}: max train-val accuracy gap="
              f"{report['max_accuracy_gap']}, best val_accuracy="
              f"{report['best_val_accuracy']} (epoch {report['best_val_epoch']}), "
              f"warnings={len(report['warnings'])}")

    run_info = {
        "environment": env,
        "arguments": vars(args),
        "class_names": CLASS_NAMES,
        "model": {
            "backbone": BACKBONE,
            "parameters": model_lib.trainable_parameter_summary(model),
            "gradcam_layer": model_lib.find_last_conv_layer(model),
        },
        "stage1_best_val_accuracy": stage1_val,
        "stage2_best_val_accuracy": stage2_val,
        "best_model": {"path": str(best_path), "validation_metrics": val_metrics},
        "stage_seconds": seconds,
        "seconds_per_epoch": timers,
        "artifacts": {key: str(value) for key, value in paths.items()},
        "test_set_note": ("The test split was deliberately not touched during "
                          "training; run python -m ml.src.evaluate on the frozen "
                          "model."),
        "disclaimer": DISCLAIMER,
    }
    _json_dump(paths["run_info"], run_info)

    model_lib.save_label_map(paths["label_map"], CLASS_NAMES, extra={
        "stage1_best_val_accuracy": stage1_val,
        "stage2_best_val_accuracy": stage2_val,
        "validation_metrics": val_metrics,
        "training": {
            "loss": args.loss,
            "batch_size": args.batch_size,
            "stage1_epochs": args.epochs_stage1,
            "stage2_epochs": args.epochs_stage2,
            "fine_tune_from": args.fine_tune_from,
        },
    })

    print("=" * 72)
    print("  TRAINING COMPLETE")
    print("=" * 72)
    print(f"  best model      : {best_path}")
    print(f"  validation acc. : {val_metrics.get('accuracy', float('nan')):.4f} "
          f"(top-3 {val_metrics.get('top3_accuracy', float('nan')):.4f})")
    print(f"  training curves : {paths['curves']}")
    print("  next step       : python -m ml.src.evaluate")
    print(f"\n  {DISCLAIMER}")
    print("=" * 72)
    return run_info


if __name__ == "__main__":
    main()




