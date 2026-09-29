"""Backend configuration. Single place for frozen ML policy constants."""
from __future__ import annotations
import os
from pathlib import Path
BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent
MODEL_PATH = Path(os.getenv("MEDIMINDS_MODEL_PATH",
    str(PROJECT_ROOT / "ml" / "artifacts" / "best_model.keras")))
# FROZEN operating point — selected on VALIDATION ONLY. Never re-tune on test.
REFERRAL_THRESHOLD = float(os.getenv("MEDIMINDS_REFERRAL_THRESHOLD", "0.35"))
THRESHOLD_SOURCE = ("Threshold 0.35 selected on validation data only "
    "(ml/artifacts/evaluation/val_threshold_sweep.json); not re-tuned on test.")
MALIGNANT_GROUP = ("mel", "bcc", "akiec")
MAX_UPLOAD_MB = float(os.getenv("MEDIMINDS_MAX_UPLOAD_MB", "8"))
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MIN_DIMENSION = 64
BLUR_THRESHOLD = float(os.getenv("MEDIMINDS_BLUR_THRESHOLD", "60.0"))
CORS_ORIGINS = [o.strip() for o in
    os.getenv("MEDIMINDS_CORS_ORIGINS", "http://localhost:8080").split(",") if o.strip()]
DISCLAIMER = ("AI-assisted screening only. This model is a research/educational tool that "
    "flags potentially concerning skin lesions. It does NOT diagnose cancer, is "
    "not a medical device, and must never replace assessment by a qualified "
    "dermatologist or other licensed clinician.")
GRADCAM_LAYER = "top_activation"
IMAGE_SIZE = (224, 224)
