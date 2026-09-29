"""
Central configuration for the MediMinds Skin Sense ML pipeline.

All paths and hyper-parameters live here so that every module stays
in sync.  Adjust values in this single file rather than editing code.
"""
from __future__ import annotations

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# Project root = two levels up from this file (ml/src/config.py -> ml/ -> repo root)
PROJECT_ROOT = Path(__file__).resolve().parents[2]          # .../mediminds-skin-sense
DATASET_ROOT = PROJECT_ROOT / "archive"                      # archive folder
IMAGE_DIR = DATASET_ROOT / "Skin Cancer" / "Skin Cancer"    # flat image folder
METADATA_CSV = DATASET_ROOT / "HAM10000_metadata.csv"       # metadata

# ML workspace folders
ML_ROOT = PROJECT_ROOT / "ml"
DATA_DIR = ML_ROOT / "data"            # cleaned manifests + split CSVs
ARTIFACTS_DIR = ML_ROOT / "artifacts"  # models, plots, metrics
for _d in (DATA_DIR, ARTIFACTS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Model / input constants
# ---------------------------------------------------------------------------
BACKBONE = "EfficientNetB0"   # EfficientNetB0 | EfficientNetB1 | EfficientNetB2
IMAGE_SIZE = (224, 224)       # native EfficientNet input resolution
BATCH_SIZE = 32               # CPU-friendly; reduce to 16 if memory is tight
SEED = 42

# tf.data map parallelism.  TensorFlow's AUTOTUNE spawns one worker per logical
# core, which oversubscribes a shared/CPU-constrained machine and starves the
# model itself (measured: 10x slower end-to-end).  Raise this (or set it to
# tf.data.AUTOTUNE in preprocessing.py) on a dedicated workstation or GPU host.
DATA_NUM_PARALLEL_CALLS = 3

# ---------------------------------------------------------------------------
# Input-value contract  (IMPORTANT — a mismatch here silently destroys accuracy)
# ---------------------------------------------------------------------------
# Every Keras EfficientNet application (Keras >= 3) already contains, as its
# first two layers, a ``Rescaling(1/127.5, offset=-1)`` followed by a
# ``Normalization`` layer holding the ImageNet channel statistics.  Those
# layers expect pixel values in **[0, 255]**.
#
# The tf.data pipeline therefore ends with ``x * 255`` (see preprocessing.py)
# and the model never applies any further normalisation.  When switching
# backbone, keep MODEL_INPUT_RANGE in sync — model.py validates this contract
# and raises if a backbone is not wired up for it.
MODEL_INPUT_RANGE = (0.0, 255.0)

# ---------------------------------------------------------------------------
# Augmentation (training split only — see preprocessing.py for the rationale)
# ---------------------------------------------------------------------------
AUG_ROTATION = 0.05        # +-5% of 2*pi  (approx +-18 degrees)
AUG_ZOOM = 0.10            # +-10% magnification jitter
AUG_TRANSLATION = 0.10     # +-10% positional jitter
AUG_CONTRAST = 0.10        # mild illumination variation
AUG_BRIGHTNESS = 0.10      # mild exposure variation

# ---------------------------------------------------------------------------
# Model head / regularisation
# ---------------------------------------------------------------------------
DROPOUT = 0.30             # dropout on the pooled feature vector
HEAD_UNITS = 0             # 0 = linear head (GAP -> Dense); >0 adds a hidden layer
HEAD_DROPOUT = 0.15        # extra dropout used only when HEAD_UNITS > 0
L2 = 1.0e-4                # weight decay on dense head weights

# ---------------------------------------------------------------------------
# Two-stage training schedule
# ---------------------------------------------------------------------------
# NOTE: config default is 12+12 epochs (the documented full schedule).  The
# live run on this shared CPU box was deliberately launched with
# `--epochs-stage1 6 --epochs-stage2 6` because full 12+12 @ ~7 min/epoch
# would take ~3 h; the resumed/GPU run should use the 12+12 defaults.
STAGE1_EPOCHS = 12          # head-only (backbone frozen)
STAGE1_LR = 1.0e-3
STAGE2_EPOCHS = 12          # fine-tuning of the upper backbone blocks
STAGE2_LR = 2.0e-5
FINE_TUNE_FROM = "block6"   # unfreeze every backbone block from this one up
FREEZE_BATCHNORM = True     # keep BN statistics frozen (small-medical-data best practice)

# Callbacks
MONITOR = "val_accuracy"      # metric used by ModelCheckpoint / EarlyStopping
MONITOR_MODE = "max"
EARLY_STOP_PATIENCE = 4
REDUCE_LR_PATIENCE = 2
REDUCE_LR_FACTOR = 0.3
MIN_LR = 1.0e-6

# Objective
LOSS = "weighted_ce"          # weighted_ce | focal | ce
FOCAL_GAMMA = 2.0
LABEL_SMOOTHING = 0.0         # 0 disables; 0.05-0.1 is a mild overfitting brake

# Overfitting watchdog
OVERFIT_GAP_WARN = 0.12       # train_acc - val_acc above this is flagged
OVERFIT_PATIENCE = 3          # consecutive flagged epochs -> warning (no auto-stop)

# Inference
USE_TTA = True                # flip test-time augmentation (average of 4 views)

# Split ratios (70 / 15 / 15)
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# ---------------------------------------------------------------------------
# HAM10000 class information
# ---------------------------------------------------------------------------
# dx codes used in the HAM10000 metadata CSV.
DX_TO_NAME = {
    "akiec": "Actinic Keratosis / Bowen's disease-like (IEC)",
    "bcc": "Basal Cell Carcinoma",
    "bkl": "Benign Keratosis (nevus-like / seborrheic keratosis)",
    "df": "Dermatofibroma",
    "mel": "Melanoma",
    "nv": "Nevus (common mole)",
    "vasc": "Vascular Lesion (angioma, pyogenic granuloma)",
}

# Canonical ordered class list (alphabetical by dx code)
CLASS_NAMES = sorted(DX_TO_NAME.keys())  # ['akiec','bcc','bkl','df','mel','nv','vasc']

# Clinically important classes where high recall is critical
HIGH_RECALL_CLASSES = ["mel", "bcc"]  # melanoma & basal cell carcinoma

# ---------------------------------------------------------------------------
# Artifact locations (everything produced by training / evaluation)
# ---------------------------------------------------------------------------
BEST_MODEL_PATH = ARTIFACTS_DIR / "best_model.keras"
STAGE1_MODEL_PATH = ARTIFACTS_DIR / "stage1_head.keras"
STAGE2_MODEL_PATH = ARTIFACTS_DIR / "stage2_finetuned.keras"
LABEL_MAP_PATH = ARTIFACTS_DIR / "label_map.json"
HISTORY_PATH = ARTIFACTS_DIR / "training_history.json"
LOG_CSV_PATH = ARTIFACTS_DIR / "training_log.csv"
RUN_INFO_PATH = ARTIFACTS_DIR / "run_info.json"
TEST_REPORT_PATH = ARTIFACTS_DIR / "test_report.json"
VAL_REPORT_PATH = ARTIFACTS_DIR / "validation_report.json"
OVERFIT_REPORT_PATH = ARTIFACTS_DIR / "overfitting_report.json"
GRADCAM_DIR = ARTIFACTS_DIR / "gradcam"
TFLITE_PATH = ARTIFACTS_DIR / "mediminds_skin_sense.tflite"

# ---------------------------------------------------------------------------
# Product / ethics wording — reused by every report so that no output of this
# pipeline can be mistaken for a clinical diagnosis.
# ---------------------------------------------------------------------------
DISCLAIMER = (
    "AI-assisted screening only. This model is a research/educational tool that "
    "flags potentially concerning skin lesions. It does NOT diagnose cancer, is "
    "not a medical device, and must never replace assessment by a qualified "
    "dermatologist or other licensed clinician."
)
