"""Authentication & registration router for Patients and Healthcare Professionals."""
from __future__ import annotations
import uuid
import hashlib
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_db_connection

router = APIRouter(prefix="/api/auth", tags=["auth"])

import hmac
import secrets

PBKDF2_ITERATIONS = 200_000

def hash_pw(pw: str) -> str:
    """Salted PBKDF2-HMAC-SHA256. Format: pbkdf2$<salt_hex>$<dk_hex>."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ITERATIONS)
    return f"pbkdf2${salt}${dk.hex()}"

def verify_pw(pw: str, stored: str) -> bool:
    """Constant-time verification; supports legacy unsalted sha256 accounts."""
    if stored.startswith("pbkdf2$"):
        try:
            _, salt, expected = stored.split("$", 2)
        except ValueError:
            return False
        dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ITERATIONS)
        return hmac.compare_digest(dk.hex(), expected)
    return hmac.compare_digest(hashlib.sha256(pw.encode("utf-8")).hexdigest(), stored)

class PatientRegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    age: int
    gender: str
    phone: Optional[str] = None

class ProfessionalRegisterRequest(BaseModel):
    # Org info
    org_name: str
    org_address: str
    org_city: str
    org_state: str
    org_phone: Optional[str] = None
    # Professional info
    full_name: str
    email: str
    password: str
    role_title: str # 'Doctor', 'Nurse', 'Authorized Healthcare Staff'
    license_id: str
    department: str
    specialization: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register/patient")
def register_patient(req: PatientRegisterRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    user_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())
    pw_hash = hash_pw(req.password)
    
    cur.execute("""
        INSERT INTO users (id, email, password_hash, full_name, role, phone)
        VALUES (?, ?, ?, ?, 'patient', ?)
    """, (user_id, req.email, pw_hash, req.full_name, req.phone))

    cur.execute("""
        INSERT INTO patients (id, user_id, full_name, age, gender, phone)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (patient_id, user_id, req.full_name, req.age, req.gender, req.phone))
    
    conn.commit()
    conn.close()
    return {
        "status": "success",
        "user_id": user_id,
        "patient_id": patient_id,
        "role": "patient",
        "full_name": req.full_name
    }

@router.post("/register/professional")
def register_professional(req: ProfessionalRegisterRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    org_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    prof_id = str(uuid.uuid4())
    pw_hash = hash_pw(req.password)

    # Register Healthcare Organization
    cur.execute("""
        INSERT INTO organizations (id, name, address, city, state, contact_phone)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (org_id, req.org_name, req.org_address, req.org_city, req.org_state, req.org_phone))

    # Determine user role from title
    role = "doctor" if "doctor" in req.role_title.lower() else ("nurse" if "nurse" in req.role_title.lower() else "staff")

    cur.execute("""
        INSERT INTO users (id, email, password_hash, full_name, role, phone, org_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, req.email, pw_hash, req.full_name, role, req.phone, org_id))

    cur.execute("""
        INSERT INTO professionals (id, user_id, org_id, role_title, license_id, department)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (prof_id, user_id, org_id, req.role_title, req.license_id, req.department))

    conn.commit()
    conn.close()
    return {
        "status": "success",
        "user_id": user_id,
        "professional_id": prof_id,
        "org_id": org_id,
        "role": role,
        "full_name": req.full_name,
        "org_name": req.org_name
    }

@router.post("/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.org_id,
               o.name as org_name
        FROM users u
        LEFT JOIN organizations o ON u.org_id = o.id
        WHERE u.email = ?
    """, (req.email,))
    row = cur.fetchone()
    if not row or not verify_pw(req.password, row["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_info = dict(row)
    del user_info["password_hash"]

    # If patient, attach patient_id
    if user_info["role"] == "patient":
        cur.execute("SELECT id FROM patients WHERE user_id = ?", (user_info["id"],))
        p_row = cur.fetchone()
        user_info["patient_id"] = p_row["id"] if p_row else None
    else:
        cur.execute("SELECT id, role_title, license_id, department FROM professionals WHERE user_id = ?", (user_info["id"],))
        prof_row = cur.fetchone()
        if prof_row:
            user_info["professional_id"] = prof_row["id"]
            user_info["role_title"] = prof_row["role_title"]
            user_info["license_id"] = prof_row["license_id"]
            user_info["department"] = prof_row["department"]

    conn.close()
    return {"status": "success", "user": user_info}

@router.get("/me/{user_id}")
def get_user_profile(user_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.email, u.full_name, u.role, u.phone, u.org_id,
               o.name as org_name
        FROM users u
        LEFT JOIN organizations o ON u.org_id = o.id
        WHERE u.id = ?
    """, (user_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
    user_info = dict(row)
    if user_info["role"] == "patient":
        cur.execute("SELECT id, age, gender, phone FROM patients WHERE user_id = ?", (user_id,))
        p_row = cur.fetchone()
        if p_row:
            user_info["patient_id"] = p_row["id"]
            user_info["age"] = p_row["age"]
            user_info["gender"] = p_row["gender"]
    else:
        cur.execute("SELECT id, role_title, license_id, department FROM professionals WHERE user_id = ?", (user_id,))
        prof_row = cur.fetchone()
        if prof_row:
            user_info["professional_id"] = prof_row["id"]
            user_info["role_title"] = prof_row["role_title"]
            user_info["license_id"] = prof_row["license_id"]
            user_info["department"] = prof_row["department"]
    conn.close()
    return {"status": "success", "user": user_info}

