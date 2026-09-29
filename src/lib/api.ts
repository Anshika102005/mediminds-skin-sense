/** Backend response mapping. Backend is the single source of truth for ML. */
import type { PredictionResult } from "@/components/ResultCard";
import type { LesionClass, Probabilities } from "@/lib/screeningPolicy";

export const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_BASE ?? "http://127.0.0.1:8000";

export interface ScreeningApiResponse {
  id?: string;
  screening_id?: string;
  prediction: string;
  class_name: string;
  confidence: number;
  probabilities: Record<string, number>;
  top_predictions: { label: string; name: string; prob: number }[];
  malignant_prob: number;
  malignant_referral: boolean;
  referral_threshold: number;
  screening_status: string;
  referral_category?: "LOWER_CONCERN" | "NEEDS_ATTENTION" | "REQUIRES_PROFESSIONAL_REVIEW";
  status_message: string;
  gradcam_heatmap_png_b64?: string | null;
  gradcam_overlay_png_b64?: string | null;
  gradcam_explanation: string;
  image_b64?: string | null;
}

export function screeningToPrediction(d: ScreeningApiResponse): PredictionResult {
  const category: "LOWER_CONCERN" | "NEEDS_ATTENTION" | "REQUIRES_PROFESSIONAL_REVIEW" =
    d.referral_category ||
    (d.malignant_referral || d.malignant_prob >= (d.referral_threshold ?? 0.35)
      ? "REQUIRES_PROFESSIONAL_REVIEW"
      : d.malignant_prob >= 0.20
      ? "NEEDS_ATTENTION"
      : "LOWER_CONCERN");

  return {
    screeningId: d.screening_id || d.id,
    predictedClass: d.prediction as LesionClass,
    className: d.class_name,
    confidence: d.confidence <= 1.0 ? d.confidence * 100 : d.confidence,
    probabilities: d.probabilities as Probabilities,
    malignantProb: d.malignant_prob,
    referred: d.malignant_referral,
    referralThreshold: d.referral_threshold ?? 0.35,
    referralCategory: category,
    statusMessage: d.status_message,
    top3: (d.top_predictions ?? []).map((t) => ({
      label: t.label as LesionClass,
      name: t.name,
      prob: t.prob,
    })),
    gradcamHeatmap: d.gradcam_heatmap_png_b64 ?? undefined,
    gradcamOverlay: d.gradcam_overlay_png_b64 ?? undefined,
    gradcamExplanation: d.gradcam_explanation,
    imageDataUrl: d.image_b64 ?? undefined,
    demoMode: false,
  };
}
