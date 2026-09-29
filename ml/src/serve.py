"""
Read-only inference server for the frozen MediMinds Skin Sense model.

- Loads ml/artifacts/best_model.keras WITHOUT modification (no retraining).
- Applies the FROZEN validation-only referral rule:
      malignant_prob = p(mel)+p(bcc)+p(akiec); referred = malignant_prob >= 0.35
  (mirrors evaluate.apply_malignant_referral; threshold NOT re-tuned here).
- Keeps the full 7-class softmax output; never outputs a cancer diagnosis.

Run:
    pip install flask pillow numpy   # tensorflow already in ml/requirements.txt
    python -m ml.src.serve            # serves POST /predict on :5000

Contract (matches src/lib/screeningPolicy.ts):
    POST /predict  multipart file field "image"  -> JSON below
    GET  /health -> {"status": "ok", ...}
"""
from __future__ import annotations
import io
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
from PIL import Image
import config
import runtime
runtime.configure()
import tensorflow as tf
import model as model_lib
from config import BEST_MODEL_PATH, CLASS_NAMES, DISCLAIMER, DX_TO_NAME, IMAGE_SIZE
from evaluate import MALIGNANT_GROUP, apply_malignant_referral
REFERRAL_THRESHOLD = 0.35
THRESHOLD_SOURCE = ("Threshold 0.35 selected on validation data only "
    "(ml/artifacts/evaluation/val_threshold_sweep.json); not re-tuned on test.")


def preprocess_pil(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize(IMAGE_SIZE, Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32)
    return np.expand_dims(arr, 0)


def predict_array(model, arr: np.ndarray) -> dict:
    probs = np.asarray(model.predict(arr, verbose=0)[0], dtype=float)
    idx = {c: i for i, c in enumerate(CLASS_NAMES)}
    mal_idx = [idx[c] for c in MALIGNANT_GROUP]
    y_ref = apply_malignant_referral(probs.reshape(1, -1), mal_idx, REFERRAL_THRESHOLD)[0]
    pred = CLASS_NAMES[int(y_ref)]
    mal_p = float(probs[mal_idx].sum())
    top3 = sorted(range(len(CLASS_NAMES)), key=lambda i: -probs[i])[:3]
    return {"predicted_class": pred, "class_name": DX_TO_NAME[pred],
        "confidence": float(probs[idx[pred]] * 100.0),
        "probabilities": {c: float(probs[idx[c]]) for c in CLASS_NAMES},
        "malignant_prob": mal_p, "referred": bool(mal_p >= REFERRAL_THRESHOLD),
        "referral_threshold": REFERRAL_THRESHOLD, "threshold_source": THRESHOLD_SOURCE,
        "top3": [{"label": CLASS_NAMES[i], "name": DX_TO_NAME[CLASS_NAMES[i]],
            "prob": float(probs[i])} for i in top3], "disclaimer": DISCLAIMER}


def create_app(model_path: Path = BEST_MODEL_PATH):
    from flask import Flask, jsonify, request
    app = Flask(__name__)
    model = model_lib.load_trained_model(model_path, compile_model_flag=False)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "model": str(model_path),
            "classes": list(CLASS_NAMES), "referral_threshold": REFERRAL_THRESHOLD,
            "threshold_source": THRESHOLD_SOURCE})

    @app.post("/predict")
    def predict():
        if "image" not in request.files:
            return jsonify({"error": "missing multipart field 'image'"}), 400
        try:
            img = Image.open(io.BytesIO(request.files["image"].read()))
        except Exception as exc:
            return jsonify({"error": f"unreadable image: {exc}"}), 400
        return jsonify(predict_array(model, preprocess_pil(img)))

    return app


if __name__ == "__main__":
    print(f"[Serve] model={BEST_MODEL_PATH} referral_t={REFERRAL_THRESHOLD} (val-only)")
    print(f"[Serve] {DISCLAIMER}")
    create_app().run(host="127.0.0.1", port=5000)
