"""Frozen-model inference. Reuses ml/src pipeline constants exactly; never retrains."""
from __future__ import annotations
import sys
from pathlib import Path
from functools import lru_cache
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "ml" / "src"))
import runtime  # noqa: E402  (sets TF thread env vars before TF import)
runtime.configure()
import tensorflow as tf  # noqa: E402
import model as model_lib  # noqa: E402
from config import CLASS_NAMES, DX_TO_NAME  # noqa: E402
from . import config
CLASS_INDEX = {c: i for i, c in enumerate(CLASS_NAMES)}
MALIGNANT_IDX = [CLASS_INDEX[c] for c in config.MALIGNANT_GROUP]
_threshold_holder: dict = {}
def set_threshold_source():
    import json
    sweep = Path(config.PROJECT_ROOT) / "ml" / "artifacts" / "evaluation" / "val_threshold_sweep.json"
    _threshold_holder["source"] = config.THRESHOLD_SOURCE
    _threshold_holder["exists"] = sweep.exists()
@lru_cache(maxsize=1)
def get_model():
    if not config.MODEL_PATH.exists():
        raise FileNotFoundError(f"Production model not found: {config.MODEL_PATH}")
    return model_lib.load_trained_model(config.MODEL_PATH, compile_model_flag=False)
@lru_cache(maxsize=1)
def get_gradcam_parts():
    base = get_model()
    backbone = model_lib.get_backbone(base)
    last_conv = backbone.get_layer(config.GRADCAM_LAYER)
    conv_submodel = tf.keras.Model(backbone.inputs, last_conv.output, name="conv_submodel")
    # In model.py: layers are [input, backbone, gap, head_dropout, predictions]
    head_layers = base.layers[2:]
    return conv_submodel, head_layers
def preprocess_rgb(img: Image.Image) -> np.ndarray:
    rgb = img.convert("RGB").resize((config.IMAGE_SIZE[1], config.IMAGE_SIZE[0]), Image.BILINEAR)
    return np.expand_dims(np.asarray(rgb, dtype=np.float32), 0)  # [0,255] contract
def _tta_predict(model, batch: np.ndarray) -> np.ndarray:
    t = tf.convert_to_tensor(batch, dtype=tf.float32)
    views = [t, tf.image.flip_left_right(t), tf.image.flip_up_down(t),
             tf.image.flip_up_down(tf.image.flip_left_right(t))]
    outs = [np.asarray(model.predict_on_batch(v), dtype=np.float64) for v in views]
    return np.mean(outs, axis=0)
def predict_probs(batch: np.ndarray, use_tta: bool = True) -> np.ndarray:
    model = get_model()
    if use_tta:
        return _tta_predict(model, batch)[0]
    return np.asarray(model.predict(batch, verbose=0)[0], dtype=float)
def build_decision(probs: np.ndarray):
    mal_p = float(probs[MALIGNANT_IDX].sum())
    referred = bool(mal_p >= config.REFERRAL_THRESHOLD)
    if referred:
        local = MALIGNANT_IDX[int(np.argmax(probs[MALIGNANT_IDX]))]
        pred_idx = int(local)
    else:
        pred_idx = int(np.argmax(probs))
    pred = CLASS_NAMES[pred_idx]
    top3_idx = sorted(range(len(CLASS_NAMES)), key=lambda i: -float(probs[i]))[:3]
    top3 = [{"label": CLASS_NAMES[i], "name": DX_TO_NAME[CLASS_NAMES[i]],
             "prob": float(probs[i])} for i in top3_idx]
    # 3-tier referral categorization per clinical screening protocol:
    # 1. REQUIRES_PROFESSIONAL_REVIEW (malignant_prob >= 0.35)
    # 2. NEEDS_ATTENTION (0.20 <= malignant_prob < 0.35)
    # 3. LOWER_CONCERN (malignant_prob < 0.20)
    if referred:
        status = "FLAG_FOR_REVIEW"
        referral_category = "REQUIRES_PROFESSIONAL_REVIEW"
        msg = ("Requires Professional Review — Arrange assessment by a qualified healthcare professional. "
               "This AI-assisted screening result is not a diagnosis.")
    elif mal_p >= 0.20:
        status = "NEEDS_ATTENTION"
        referral_category = "NEEDS_ATTENTION"
        msg = ("Needs Attention — Consider professional review if the lesion changes or symptoms persist. "
               "This AI-assisted screening result is not a diagnosis.")
    else:
        status = "ROUTINE_NO_FLAG"
        referral_category = "LOWER_CONCERN"
        msg = ("Lower Concern — Continue routine skin awareness and monitor changes. "
               "This AI-assisted screening result is not a diagnosis.")
    return {"prediction": pred, "class_name": DX_TO_NAME[pred],
        "confidence": float(probs[pred_idx]), "malignant_prob": mal_p,
        "referred": referred, "status": status, "referral_category": referral_category,
        "message": msg, "top3": top3,
        "probabilities": {c: float(probs[CLASS_INDEX[c]]) for c in CLASS_NAMES}}

