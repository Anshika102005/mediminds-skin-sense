"""FastAPI entrypoint. Model loads once at startup; weights never modified."""
from __future__ import annotations
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import config, database, inference
from app.routers import auth, patients, professionals, screening

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()     # initialize SQLite tables
    inference.get_model()  # warm-load frozen best_model.keras once
    yield

app = FastAPI(
    title="MediMinds Skin Sense API",
    description=config.DISCLAIMER,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screening.router)
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(professionals.router)

@app.get("/")
def root():
    return {"service": "mediminds-skin-sense", "disclaimer": config.DISCLAIMER}

