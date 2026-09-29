"""Healthcare professional dashboard routes: patient records, queue, reviews, treatments, appointments."""
from __future__ import annotations
import json
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db_connection

router = APIRouter(prefix="/api/professionals", tags=["professionals"])

class ReviewUpdateRequest(BaseModel):
    review_status: str
    clinical_notes: str
    professional_id: str

class TreatmentCreateRequest(BaseModel):
    patient_id: str
    professional_id: str
    medication_notes: str
    treatment_plan: str
    start_date: str
    follow_up_date: Optional[str] = None
    treatment_status: str = "Under Treatment"

class AppointmentCreateRequest(BaseModel):
    patient_id: str
    professional_id: str
    appointment_date: str
    appointment_time: str
    purpose: str
    status: str = "Scheduled"
    notes: Optional[str] = None

@router.get("/dashboard/overview")
def get_dashboard_overview():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM patients")
    total_patients = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM screenings")
    total_screenings = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM screenings WHERE malignant_referral = 1")
    flagged_for_review = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM professional_reviews WHERE review_status = 'Follow-up Required'")
    follow_ups_pending = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM professional_reviews WHERE review_status = 'Follow-up Completed'")
    completed_followups = cur.fetchone()[0]

    cur.execute("SELECT prediction, COUNT(*) as count FROM screenings GROUP BY prediction")
    class_dist = [{"class": r["prediction"], "count": r["count"]} for r in cur.fetchall()]

    cur.execute("""
        SELECT s.id, s.patient_id, p.full_name as patient_name, s.prediction, s.class_name,
               s.confidence, s.malignant_referral, s.created_at, pr.review_status
        FROM screenings s
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN professional_reviews pr ON s.id = pr.screening_id
        ORDER BY s.created_at DESC LIMIT 10
    """)
    recent = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {
        "total_patients": total_patients,
        "total_screenings": total_screenings,
        "flagged_for_review": flagged_for_review,
        "follow_ups_pending": follow_ups_pending,
        "completed_followups": completed_followups,
        "class_distribution": class_dist,
        "recent_screenings": recent,
    }


@router.get("/screenings/flagged")
def get_flagged_screenings():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.*, p.full_name as patient_name, p.age, p.gender, p.phone,
               pr.review_status, pr.clinical_notes, pr.reviewed_at
        FROM screenings s
        JOIN patients p ON s.patient_id = p.id
        LEFT JOIN professional_reviews pr ON s.id = pr.screening_id
        WHERE s.malignant_referral = 1
        ORDER BY s.created_at DESC
    """)
    rows = cur.fetchall()
    res = []
    for r in rows:
        d = dict(r)
        d["probabilities"] = json.loads(d["probabilities_json"]) if d["probabilities_json"] else {}
        d["top_predictions"] = json.loads(d["top3_json"]) if d["top3_json"] else []
        res.append(d)
    conn.close()
    return res

@router.get("/patients")
def list_patients():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.*, COUNT(s.id) as total_screenings,
               MAX(s.created_at) as last_screening_date,
               MAX(s.malignant_referral) as has_flagged_screening
        FROM patients p
        LEFT JOIN screenings s ON p.id = s.patient_id
        GROUP BY p.id
        ORDER BY last_screening_date DESC
    """)
    patients = [dict(r) for r in cur.fetchall()]
    conn.close()
    return patients

@router.get("/patients/{patient_id}/full-record")
def get_patient_full_record(patient_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = cur.fetchone()
    if not patient:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient record not found")

    cur.execute("""
        SELECT s.*, pr.review_status, pr.clinical_notes, pr.reviewed_at
        FROM screenings s
        LEFT JOIN professional_reviews pr ON s.id = pr.screening_id
        WHERE s.patient_id = ?
        ORDER BY s.created_at DESC
    """, (patient_id,))
    screenings = []
    for r in cur.fetchall():
        d = dict(r)
        d["probabilities"] = json.loads(d["probabilities_json"]) if d["probabilities_json"] else {}
        d["top_predictions"] = json.loads(d["top3_json"]) if d["top3_json"] else []
        screenings.append(d)

    cur.execute("""
        SELECT t.*, u.full_name as clinician_name
        FROM treatment_records t
        LEFT JOIN professionals p ON t.professional_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE t.patient_id = ?
        ORDER BY t.start_date DESC
    """, (patient_id,))
    treatments = [dict(r) for r in cur.fetchall()]

    cur.execute("""
        SELECT a.*, u.full_name as clinician_name
        FROM appointments a
        LEFT JOIN professionals p ON a.professional_id = p.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC
    """, (patient_id,))
    appointments = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {
        "patient": dict(patient),
        "screenings": screenings,
        "treatments": treatments,
        "appointments": appointments
    }

@router.post("/screenings/{screening_id}/review")
def update_screening_review(screening_id: str, req: ReviewUpdateRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM professional_reviews WHERE screening_id = ?", (screening_id,))
    existing = cur.fetchone()

    if existing:
        cur.execute("""
            UPDATE professional_reviews
            SET review_status = ?, clinical_notes = ?, professional_id = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE screening_id = ?
        """, (req.review_status, req.clinical_notes, req.professional_id, screening_id))
    else:
        cur.execute("""
            INSERT INTO professional_reviews (id, screening_id, professional_id, review_status, clinical_notes)
            VALUES (?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), screening_id, req.professional_id, req.review_status, req.clinical_notes))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Clinical review updated successfully."}

@router.post("/treatments")
def create_treatment(req: TreatmentCreateRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    rec_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO treatment_records (
            id, patient_id, professional_id, medication_notes, treatment_plan,
            start_date, follow_up_date, treatment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rec_id, req.patient_id, req.professional_id, req.medication_notes,
        req.treatment_plan, req.start_date, req.follow_up_date, req.treatment_status
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "treatment_id": rec_id}

@router.post("/appointments")
def create_appointment(req: AppointmentCreateRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    apt_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO appointments (
            id, patient_id, professional_id, appointment_date, appointment_time,
            purpose, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        apt_id, req.patient_id, req.professional_id, req.appointment_date,
        req.appointment_time, req.purpose, req.status, req.notes
    ))
    conn.commit()
    conn.close()
    return {"status": "success", "appointment_id": apt_id}
