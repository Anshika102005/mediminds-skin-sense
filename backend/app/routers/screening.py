"""Screening router: validate -> quality gate -> inference(+TTA) -> referral(0.35) -> Grad-CAM."""
from __future__ import annotations
from fastapi import APIRouter, File, HTTPException, UploadFile
from app import config, gradcam, image_quality, inference, schemas
router = APIRouter()
@router.get("/health")
def health():
    return {"status": "ok", "model": "EfficientNetB0",
        "model_present": config.MODEL_PATH.exists(),
        "referral_threshold": config.REFERRAL_THRESHOLD,
        "threshold_source": config.THRESHOLD_SOURCE}
@router.post("/api/screening/predict", response_model=schemas.ScreeningResponse)
async def predict(image: UploadFile = File(...), use_tta: bool = True,
                  with_gradcam: bool = True):
    raw = await image.read()
    quality, rgb = image_quality.check_image(raw, image.content_type)
    q = schemas.ImageQuality(passed=quality.passed, width=quality.width,
        height=quality.height, blur_score=round(quality.blur_score, 2),
        brightness=round(quality.brightness, 4), message=quality.message)
    if not quality.passed or rgb is None:
        raise HTTPException(status_code=422, detail={
            "error": "Image quality is not sufficient for reliable AI-assisted screening. Please capture a clearer image.",
            "recommendations": [
                "Use better lighting without harsh flash glare",
                "Keep camera steady to avoid motion blur",
                "Ensure lesion is in focus and centered in frame",
                "Avoid excessive distance or heavy digital zoom",
                "Retake the image with clean camera lens"
            ],
            "image_quality": q.model_dump()})
    batch = inference.preprocess_rgb(rgb)
    try:
        probs = inference.predict_probs(batch, use_tta=use_tta)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    d = inference.build_decision(probs)
    heat_b64, over_b64 = None, None
    if with_gradcam:
        try:
            heat_b64, over_b64 = gradcam.gradcam_for_array(batch)
        except Exception:
            heat_b64, over_b64 = None, None
    return schemas.ScreeningResponse(
        prediction=d["prediction"], class_name=d["class_name"],
        confidence=d["confidence"], probabilities=d["probabilities"],
        top_predictions=d["top3"], malignant_prob=d["malignant_prob"],
        malignant_referral=d["referred"],
        referral_threshold=config.REFERRAL_THRESHOLD,
        threshold_source=config.THRESHOLD_SOURCE,
        screening_status=d["status"],
        referral_category=d.get("referral_category"),
        status_message=d["message"],
        gradcam_heatmap_png_b64=heat_b64, gradcam_overlay_png_b64=over_b64,
        gradcam_explanation=gradcam.EXPLANATION, image_quality=q,
        tta_applied=use_tta, disclaimer=config.DISCLAIMER)

@router.get("/api/screenings/{screening_id}")
def get_screening(screening_id: str):
    import json
    from app.database import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.*, p.full_name as patient_name, p.age as patient_age, p.gender as patient_gender,
               pr.review_status, pr.clinical_notes, pr.reviewed_at
        FROM screenings s
        LEFT JOIN patients p ON s.patient_id = p.id
        LEFT JOIN professional_reviews pr ON s.id = pr.screening_id
        WHERE s.id = ?
    """, (screening_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Screening record not found")
    d = dict(row)
    d["probabilities"] = json.loads(d["probabilities_json"]) if d["probabilities_json"] else {}
    d["top_predictions"] = json.loads(d["top3_json"]) if d["top3_json"] else []
    d["gradcam_overlay_png_b64"] = d.get("gradcam_overlay_b64")
    d["gradcam_heatmap_png_b64"] = d.get("gradcam_heatmap_b64")
    d["gradcam_explanation"] = gradcam.EXPLANATION
    return d

@router.get("/api/screenings/{screening_id}/gradcam")
def get_screening_gradcam(screening_id: str):
    from app.database import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, patient_id, prediction, class_name, confidence, malignant_prob,
               malignant_referral, screening_status, status_message,
               gradcam_overlay_b64, gradcam_heatmap_b64, image_b64, created_at
        FROM screenings WHERE id = ?
    """, (screening_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Screening record not found")
    d = dict(row)
    d["gradcam_overlay_png_b64"] = d.get("gradcam_overlay_b64")
    d["gradcam_heatmap_png_b64"] = d.get("gradcam_heatmap_b64")
    d["gradcam_explanation"] = gradcam.EXPLANATION
    return d

