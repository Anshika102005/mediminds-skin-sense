"""Patient record & screening management routes."""
from __future__ import annotations
import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db_connection

router = APIRouter(prefix="/api/patients", tags=["patients"])

class SaveScreeningRequest(BaseModel):
    patient_id: Optional[str] = None
    patient_name: str
    patient_age: int
    patient_gender: str
    patient_phone: Optional[str] = None
    prediction: str
    class_name: str
    confidence: float
    probabilities: dict
    top_predictions: list
    malignant_prob: float
    malignant_referral: bool
    screening_status: str
    status_message: str
    gradcam_overlay_png_b64: Optional[str] = None
    gradcam_heatmap_png_b64: Optional[str] = None
    image_b64: Optional[str] = None

@router.post("/screenings/save")
def save_screening(req: SaveScreeningRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Resolve or create patient record
    patient_id = req.patient_id
    if not patient_id:
        # Check if patient exists by phone or create new patient record
        patient_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO patients (id, full_name, age, gender, phone)
            VALUES (?, ?, ?, ?, ?)
        """, (patient_id, req.patient_name, req.patient_age, req.patient_gender, req.patient_phone))

    # 2. Insert screening record
    screening_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO screenings (
            id, patient_id, prediction, class_name, confidence,
            probabilities_json, top3_json, malignant_prob,
            malignant_referral, screening_status, status_message,
            gradcam_overlay_b64, gradcam_heatmap_b64, image_b64
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        screening_id, patient_id, req.prediction, req.class_name, req.confidence,
        json.dumps(req.probabilities), json.dumps(req.top_predictions),
        req.malignant_prob, req.malignant_referral, req.screening_status, req.status_message,
        req.gradcam_overlay_png_b64, req.gradcam_heatmap_png_b64, req.image_b64
    ))

    # 3. Create initial review entry
    review_id = str(uuid.uuid4())
    initial_status = "Follow-up Required" if req.malignant_referral else "New Screening"
    cur.execute("""
        INSERT INTO professional_reviews (id, screening_id, professional_id, review_status, clinical_notes)
        VALUES (?, ?, 'pending_assignment', ?, ?)
    """, (review_id, screening_id, initial_status, "Awaiting authorized clinician review."))

    conn.commit()
    conn.close()
    return {"status": "success", "screening_id": screening_id, "patient_id": patient_id}

@router.get("/{patient_id}/screenings")
def get_patient_screenings(patient_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.*, pr.review_status, pr.clinical_notes, pr.reviewed_at
        FROM screenings s
        LEFT JOIN professional_reviews pr ON s.id = pr.screening_id
        WHERE s.patient_id = ?
        ORDER BY s.created_at DESC
    """, (patient_id,))
    rows = cur.fetchall()
    screenings = []
    for r in rows:
        d = dict(r)
        d["probabilities"] = json.loads(d["probabilities_json"]) if d["probabilities_json"] else {}
        d["top_predictions"] = json.loads(d["top3_json"]) if d["top3_json"] else []
        screenings.append(d)

    # Get appointments for this patient
    cur.execute("""
        SELECT a.*, u.full_name as doctor_name, o.name as org_name
        FROM appointments a
        LEFT JOIN professionals p ON a.professional_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN organizations o ON p.org_id = o.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date ASC
    """, (patient_id,))
    appointments = [dict(a) for a in cur.fetchall()]

    conn.close()
    return {"screenings": screenings, "appointments": appointments}
