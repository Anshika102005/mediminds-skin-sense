"""End-to-end smoke test for MediMinds Skin Sense backend. Run: python backend/e2e_test.py"""
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"
PASS, FAIL = 0, 0


def req(method, path, payload=None):
    url = BASE + path
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body[:200].decode(errors="replace")}


def check(name, cond, extra=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} {extra}")


def register_or_ok(st, d, name=""):
    """Registration may 400 if the account already exists from a prior run."""
    return (st == 200 and d.get("status") == "success") or (st == 400 and "already exists" in str(d))


print("== Health ==")
st, d = req("GET", "/health")
check("health 200", st == 200 and d.get("status") == "ok")
check("threshold frozen at 0.35", d.get("referral_threshold") == 0.35, str(d))

print("== Patient register / login ==")
st, d = req("POST", "/api/auth/register/patient", {
    "full_name": "E2E Patient", "email": "e2e_patient@example.com",
    "password": "Passw0rd!", "age": 41, "gender": "Female", "phone": "1234567890"})
check("register patient", register_or_ok(st, d), str(d))
patient_id = d.get("patient_id")

st, d = req("POST", "/api/auth/login", {"email": "e2e_patient@example.com", "password": "Passw0rd!"})
check("patient login", st == 200 and d.get("user", {}).get("role") == "patient", str(d))
patient_id = d.get("user", {}).get("patient_id") or patient_id
check("login returns patient_id", bool(patient_id))

print("== Professional register / login ==")
st, d = req("POST", "/api/auth/register/professional", {
    "org_name": "E2E General Hospital", "org_address": "1 Test Road",
    "org_city": "Pune", "org_state": "MH", "org_phone": "2222222222",
    "full_name": "Dr E2E", "email": "e2e_doc@example.com", "password": "Passw0rd!",
    "role_title": "Doctor", "license_id": "MED-12345", "department": "Dermatology",
    "phone": "3333333333"})
check("register professional", register_or_ok(st, d), str(d))

st, d = req("POST", "/api/auth/login", {"email": "e2e_doc@example.com", "password": "Passw0rd!"})
check("professional login", st == 200 and d.get("user", {}).get("role") == "doctor", str(d))
professional_id = d.get("user", {}).get("professional_id")
check("login returns professional_id", bool(professional_id))

st, d = req("POST", "/api/auth/login", {"email": "e2e_doc@example.com", "password": "wrong"})
check("bad password rejected 401", st == 401, str(st))


print("== Save screening (flagged melanoma-style result) ==")
st, d = req("POST", "/api/patients/screenings/save", {
    "patient_id": patient_id, "patient_name": "E2E Patient", "patient_age": 41,
    "patient_gender": "Female", "prediction": "mel", "class_name": "Melanoma",
    "confidence": 0.61, "probabilities": {"mel": 0.61, "nv": 0.30, "bcc": 0.02,
                                           "akiec": 0.01, "bkl": 0.03, "df": 0.01, "vasc": 0.02},
    "top_predictions": [{"label": "mel", "name": "Melanoma", "prob": 0.61},
                         {"label": "nv", "name": "Nevus (common mole)", "prob": 0.30},
                         {"label": "bkl", "name": "Seborrheic keratosis", "prob": 0.03}],
    "malignant_prob": 0.64, "malignant_referral": True,
    "screening_status": "FLAG_FOR_REVIEW",
    "status_message": "Potentially concerning — professional review recommended.",
    "gradcam_overlay_png_b64": "aGVsbG8=", "gradcam_heatmap_png_b64": "d29ybGQ=",
    "image_b64": None})
check("save screening", st == 200 and d.get("status") == "success", str(d))
screening_id = d.get("screening_id")

print("== Patient screenings list ==")
st, d = req("GET", f"/api/patients/{patient_id}/screenings")
check("list screenings", st == 200 and len(d.get("screenings", [])) >= 1, str(d)[:200])
check("screening carries gradcam", bool(d.get("screenings", [{}])[0].get("gradcam_overlay_b64")))
check("screening review seeded", bool(d.get("screenings", [{}])[0].get("review_status")))

print("== Professional dashboard ==")
st, d = req("GET", "/api/professionals/dashboard/overview")
check("overview 200", st == 200, str(d)[:200])
check("overview has KPI keys", all(k in d for k in
      ["total_patients", "total_screenings", "flagged_for_review",
       "follow_ups_pending", "completed_followups"]))
check("flagged count >= 1", d.get("flagged_for_review", 0) >= 1, str(d))

st, d = req("GET", "/api/professionals/screenings/flagged")
check("flagged list", st == 200 and isinstance(d, list) and len(d) >= 1, str(d)[:200])

st, d = req("GET", "/api/professionals/patients")
check("patients list", st == 200 and isinstance(d, list) and len(d) >= 1, str(d)[:200])

print("== Patient full record ==")
st, d = req("GET", f"/api/professionals/patients/{patient_id}/full-record")
check("full record 200", st == 200 and "patient" in d, str(d)[:200])
check("full record has screenings", len(d.get("screenings", [])) >= 1)
check("full record has appointments key", "appointments" in d)
check("full record has treatments key", "treatments" in d)

print("== Clinical review ==")
st, d = req("POST", f"/api/professionals/screenings/{screening_id}/review", {
    "review_status": "Follow-up Required", "clinical_notes": "E2E review note.",
    "professional_id": professional_id})
check("save review", st == 200 and d.get("status") == "success", str(d))

st, d = req("GET", f"/api/patients/{patient_id}/screenings")
sc = next((s for s in d.get("screenings", []) if s["id"] == screening_id), {})
check("review persisted", sc.get("review_status") == "Follow-up Required", str(sc.get("review_status")))

print("== Appointment ==")
st, d = req("POST", "/api/professionals/appointments", {
    "patient_id": patient_id, "professional_id": professional_id,
    "appointment_date": "2026-10-05", "appointment_time": "10:30",
    "purpose": "E2E lesion evaluation", "status": "Scheduled"})
check("create appointment", st == 200 and d.get("status") == "success", str(d))

st, d = req("GET", f"/api/patients/{patient_id}/screenings")
check("appointment listed for patient", any(
    a.get("appointment_date") == "2026-10-05" for a in d.get("appointments", [])),
    str(d.get("appointments")))

print("== Treatment record ==")
st, d = req("POST", "/api/professionals/treatments", {
    "patient_id": patient_id, "professional_id": professional_id,
    "medication_notes": "E2E medication", "treatment_plan": "E2E plan",
    "start_date": "2026-10-05", "follow_up_date": "2026-11-05",
    "treatment_status": "Under Treatment"})
check("create treatment", st == 200 and d.get("status") == "success", str(d))

st, d = req("GET", f"/api/professionals/patients/{patient_id}/full-record")
check("treatment persisted", len(d.get("treatments", [])) >= 1)

print(f"\n===== RESULT: {PASS} passed, {FAIL} failed =====")
raise SystemExit(1 if FAIL else 0)

