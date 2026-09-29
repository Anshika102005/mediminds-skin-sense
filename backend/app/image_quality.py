"""Image validation + quality gate. Returns 422-worthy reasons; never runs inference on bad input."""
from __future__ import annotations
import io
from dataclasses import dataclass
from PIL import Image
import numpy as np
import cv2
from . import config
@dataclass
class QualityResult:
    passed: bool
    width: int
    height: int
    blur_score: float
    brightness: float
    message: str
def _blur_score(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())
def check_image(raw: bytes, content_type: str | None) -> tuple[QualityResult, Image.Image | None]:
    if not raw:
        return QualityResult(False, 0, 0, 0.0, 0.0, "Empty file received. Please upload a valid skin image."), None
    if len(raw) > config.MAX_UPLOAD_MB * 1024 * 1024:
        return QualityResult(False, 0, 0, 0.0, 0.0,
            f"Image too large (limit {config.MAX_UPLOAD_MB:g} MB). Please compress and retry."), None
    try:
        img = Image.open(io.BytesIO(raw))
        img.load()
    except Exception:
        return QualityResult(False, 0, 0, 0.0, 0.0,
            "Image quality is insufficient for reliable screening. Please capture a clearer image."), None
    if img.format not in ("JPEG", "PNG", "WEBP", "JPG", "MPO"):
        # format may be None for some uploads; fall back to content-type check
        if (content_type or "") not in config.ALLOWED_CONTENT_TYPES and img.format is not None:
            return QualityResult(False, 0, 0, 0.0, 0.0,
                "Unsupported file type. Please upload a JPEG or PNG image."), None
    rgb = img.convert("RGB")
    w, h = rgb.size
    if min(w, h) < config.MIN_DIMENSION:
        return QualityResult(False, w, h, 0.0, 0.0,
            "Image resolution too low for reliable screening. Please capture a clearer, closer image."), None
    gray = np.asarray(rgb.convert("L"), dtype=np.uint8)
    blur = _blur_score(gray)
    brightness = float(np.asarray(rgb, dtype=np.float32).mean() / 255.0)
    if blur < config.BLUR_THRESHOLD:
        return QualityResult(False, w, h, blur, brightness,
            "Image is too blurry for reliable screening. Please capture a clearer, in-focus image."), None
    if brightness < 0.08 or brightness > 0.97:
        return QualityResult(False, w, h, blur, brightness,
            "Image is extremely dark/bright. Please retake in even lighting without flash glare."), None
    gray_std = float(gray.std() / 255.0)
    if gray_std < 0.02:
        return QualityResult(False, w, h, blur, brightness,
            "Image has too little visible detail. Please capture a clearer image of the lesion."), None
    return QualityResult(True, w, h, blur, brightness, "Image quality OK."), rgb
