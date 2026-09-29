"""Pydantic response contracts. No filesystem paths are ever exposed."""
from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
class TopPrediction(BaseModel):
    label: str
    name: str
    prob: float = Field(ge=0.0, le=1.0)
class ImageQuality(BaseModel):
    passed: bool
    width: int
    height: int
    blur_score: float
    brightness: float
    message: str
class ScreeningResponse(BaseModel):
    prediction: str
    class_name: str
    confidence: float = Field(ge=0.0, le=1.0)
    probabilities: Dict[str, float]
    top_predictions: List[TopPrediction]
    malignant_prob: float = Field(ge=0.0, le=1.0)
    malignant_referral: bool
    referral_threshold: float
    threshold_source: str
    screening_status: str
    referral_category: Optional[str] = None
    status_message: str
    gradcam_heatmap_png_b64: Optional[str] = None
    gradcam_overlay_png_b64: Optional[str] = None
    gradcam_explanation: str
    image_quality: ImageQuality
    model: str = "EfficientNetB0"
    tta_applied: bool
    disclaimer: str
