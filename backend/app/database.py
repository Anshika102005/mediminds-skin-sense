"""SQLite database configuration and session management for MediMinds Skin Sense."""
from __future__ import annotations
import os
import sqlite3
from pathlib import Path
from typing import Generator

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "mediminds.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Organizations
    cur.execute("""
    CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        contact_phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Users (patients, doctors, nurses, staff)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'patient', 'doctor', 'nurse', 'staff', 'admin'
        phone TEXT,
        org_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (org_id) REFERENCES organizations(id)
    )
    """)

    # 3. Professional details (for doctor, nurse, staff)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS professionals (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        org_id TEXT NOT NULL,
        role_title TEXT NOT NULL, -- 'Doctor', 'Nurse', 'Authorized Healthcare Staff'
        license_id TEXT NOT NULL,
        department TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (org_id) REFERENCES organizations(id)
    )
    """)

    # 4. Patient profile records
    cur.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        phone TEXT,
        org_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (org_id) REFERENCES organizations(id)
    )
    """)

    # 5. Screenings (connected to ML results & Grad-CAM)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS screenings (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        prediction TEXT NOT NULL,
        class_name TEXT NOT NULL,
        confidence REAL NOT NULL,
        probabilities_json TEXT NOT NULL,
        top3_json TEXT NOT NULL,
        malignant_prob REAL NOT NULL,
        malignant_referral BOOLEAN NOT NULL,
        screening_status TEXT NOT NULL,
        status_message TEXT NOT NULL,
        gradcam_overlay_b64 TEXT,
        gradcam_heatmap_b64 TEXT,
        image_b64 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
    """)

    # 6. Professional Reviews
    cur.execute("""
    CREATE TABLE IF NOT EXISTS professional_reviews (
        id TEXT PRIMARY KEY,
        screening_id TEXT NOT NULL,
        professional_id TEXT NOT NULL,
        review_status TEXT NOT NULL, -- 'New Screening', 'Under Review', 'Follow-up Required', 'Follow-up Completed'
        clinical_notes TEXT NOT NULL,
        reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (screening_id) REFERENCES screenings(id),
        FOREIGN KEY (professional_id) REFERENCES professionals(id)
    )
    """)

    # 7. Treatment records
    cur.execute("""
    CREATE TABLE IF NOT EXISTS treatment_records (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        professional_id TEXT NOT NULL,
        medication_notes TEXT NOT NULL,
        treatment_plan TEXT NOT NULL,
        start_date TEXT NOT NULL,
        follow_up_date TEXT,
        treatment_status TEXT NOT NULL, -- 'Under Treatment', 'Completed', 'Discontinued'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (professional_id) REFERENCES professionals(id)
    )
    """)

    # 8. Appointments
    cur.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        professional_id TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL, -- 'Scheduled', 'Completed', 'Cancelled', 'Follow-up Required'
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (professional_id) REFERENCES professionals(id)
    )
    """)

    conn.commit()
    conn.close()
