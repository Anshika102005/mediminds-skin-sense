# MediMinds Skin Sense

**AI-assisted skin screening and professional review support platform.**

MediMinds Skin Sense screens skin-lesion images with a frozen EfficientNetB0 model,
visualises the influential image region with Grad-CAM, applies a validated malignant
referral policy, and connects screening results with authorised healthcare
professionals for review, follow-up, and appointment tracking.

> **Disclaimer:** AI-assisted screening only. This system does not provide a medical
> diagnosis, does not confirm cancer, and does not replace evaluation by a qualified
> healthcare professional. It is a research/educational tool, not a medical device.

---

## Architecture

```
React + Vite + TypeScript frontend (port 8080)
        ↓  REST (multipart + JSON)
FastAPI backend (port 8000)
        ↓  validate → quality gate → TTA inference → referral policy → Grad-CAM
TensorFlow / Keras · EfficientNetB0 · best_model.keras (frozen, never retrained)
        ↓
SQLite (backend/data/mediminds.db)
        ↓
Frontend dashboards (patient + healthcare professional)
```

## Key features

- **Patient flow** — role selection → patient information → image upload/capture →
  image-quality check → real AI screening (7 classes, TTA) → confidence + top-3 →
  Grad-CAM overlay → referral status → ABCDE awareness → saved screening history →
  dashboard with timeline and appointments.
- **Healthcare professional flow** — organisation + professional registration →
  secure login → clinician dashboard (KPIs, flagged-review queue, patient directory,
  patient records with images + Grad-CAM) → clinical reviews → treatment/medication
  records entered by clinicians → appointment scheduling → follow-up tracking.
- **Explainable AI** — original image, Grad-CAM heatmap and overlay returned by the
  backend for every screening.
- **English / Hindi** — full language switch for navigation, forms, results,
  dashboard labels, and disclaimers.
- **Responsive** — mobile-first screening flow and dashboards.

## ML policy (frozen)

- Model: `ml/artifacts/best_model.keras` — **never retrained or modified**.
- Classes: `akiec, bcc, bkl, df, mel, nv, vasc` at 224×224.
- Referral rule: `malignant_prob = p(mel)+p(bcc)+p(akiec) ≥ 0.35 → Flag for review`.
- Threshold **0.35 was selected on validation data only**
  (`ml/artifacts/evaluation/val_threshold_sweep.json`) and never re-tuned on test.
- TTA (4-view flip averaging) and Grad-CAM are applied at inference time.

## Running locally

### 1. Backend (FastAPI + model)

```bash
# Python 3.11+ with: fastapi uvicorn tensorflow pillow opencv-python pydantic
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
# Model warm-loads at startup; GET http://127.0.0.1:8000/health
```

### 2. Frontend (Vite dev server)

```bash
npm install
npm run dev          # http://localhost:8080
# API base URL defaults to http://127.0.0.1:8000 (override with VITE_API_BASE)
```

### 3. End-to-end API test

```bash
# with the backend running:
python backend/e2e_test.py     # 28 checks: auth, screening, reviews, appointments
```

## Database

SQLite tables: `organizations`, `users` (patients/doctors/nurses/staff),
`professionals`, `patients`, `screenings` (prediction + Grad-CAM + image),
`professional_reviews`, `treatment_records`, `appointments`.
Role-based access: patients see their own records; professionals see authorised
organisation records.

## Repository layout

```
backend/app/        FastAPI app: routers, inference, gradcam, quality gate, DB
ml/                 Frozen ML pipeline: model, TTA, evaluation artifacts
src/                React frontend (pages, components, i18n, API client)
src/lib/api.ts      Backend response → UI mapping (backend is the single source of truth)
src/lib/screeningPolicy.ts   7-class referral policy mirroring the backend
```

## Security notes

- Passwords are hashed before storage; login failures return 401.
- Uploads are validated (type, size, dimensions, blur) with sanitised handling;
  no filesystem paths are exposed through the API.
- CORS is configurable via environment (`MEDIMINDS_CORS_ORIGINS`).

---

Dataset: ISIC skin-lesion images (HAM10000). For research and educational use.


