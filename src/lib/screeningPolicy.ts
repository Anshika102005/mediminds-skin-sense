/**
 * Frozen screening policy for MediMinds Skin Sense.
 *
 * Mirrors ml/src/evaluate.py::apply_malignant_referral exactly:
 *   malignantProb = p(mel) + p(bcc) + p(akiec)
 *   referred = malignantProb >= REFERRAL_THRESHOLD
 *   displayClass = argmax within {mel,bcc,akiec} if referred else argmax overall
 *
 * - Model weights (best_model.keras) are NEVER modified here.
 * - REFERRAL_THRESHOLD = 0.35 was selected on VALIDATION ONLY
 *   (ml/artifacts/evaluation/val_threshold_sweep.json) and NOT re-tuned on test.
 * - This module performs deterministic post-processing of frozen softmax outputs.
 * - It never outputs a cancer diagnosis — only a similarity pattern + review flag.
 */

export const CLASS_NAMES = [
  "akiec",
  "bcc",
  "bkl",
  "df",
  "mel",
  "nv",
  "vasc",
] as const;

export type LesionClass = (typeof CLASS_NAMES)[number];

export const DX_TO_NAME: Record<LesionClass, string> = {
  akiec: "Actinic Keratosis / Bowen's disease-like (IEC)",
  bcc: "Basal Cell Carcinoma",
  bkl: "Benign Keratosis (nevus-like / seborrheic keratosis)",
  df: "Dermatofibroma",
  mel: "Melanoma",
  nv: "Nevus (common mole)",
  vasc: "Vascular Lesion (angioma, pyogenic granuloma)",
};

export const MALIGNANT_GROUP: LesionClass[] = ["mel", "bcc", "akiec"];

/** Frozen operating point — selected on validation only. Do not tune on test. */
export const REFERRAL_THRESHOLD = 0.35;

export const THRESHOLD_SOURCE =
  "Threshold 0.35 selected on validation data only " +
  "(ml/artifacts/evaluation/val_threshold_sweep.json); not re-tuned on test.";

export const DISCLAIMER =
  "AI-assisted screening only. This model is a research/educational tool that " +
  "flags potentially concerning skin lesions. It does NOT diagnose cancer, is " +
  "not a medical device, and must never replace assessment by a qualified " +
  "dermatologist or other licensed clinician.";

export type Probabilities = Record<LesionClass, number>;

export interface ScreeningDecision {
  /** 7-class argmax, or argmax within malignant group when referred. */
  predictedClass: LesionClass;
  /** Human-readable pattern name (NOT a diagnosis). */
  className: string;
  /** Softmax confidence of predictedClass, 0..1. */
  confidence: number;
  /** p(mel)+p(bcc)+p(akiec), 0..1. */
  malignantProb: number;
  /** True when malignantProb >= 0.35. */
  referred: boolean;
  referralThreshold: number;
  /** Top-3 patterns for transparency (never a diagnosis). */
  top3: { label: LesionClass; name: string; prob: number }[];
}

export function applyMalignantReferral(
  probs: Probabilities,
  threshold: number = REFERRAL_THRESHOLD
): ScreeningDecision {
  const entries = CLASS_NAMES.map((c) => ({ label: c, prob: probs[c] ?? 0 }));
  const argmax = entries.reduce((a, b) => (b.prob > a.prob ? b : a));
  const malignantProb = MALIGNANT_GROUP.reduce(
    (s, c) => s + (probs[c] ?? 0),
    0
  );
  const referred = malignantProb >= threshold;
  let predicted = argmax.label;
  if (referred) {
    const malEntries = entries.filter((e) =>
      (MALIGNANT_GROUP as string[]).includes(e.label)
    );
    predicted = malEntries.reduce((a, b) => (b.prob > a.prob ? b : a)).label;
  }
  const top3 = [...entries]
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 3)
    .map((e) => ({ label: e.label, name: DX_TO_NAME[e.label], prob: e.prob }));
  return {
    predictedClass: predicted,
    className: DX_TO_NAME[predicted],
    confidence: probs[predicted] ?? 0,
    malignantProb,
    referred,
    referralThreshold: threshold,
    top3,
  };
}
