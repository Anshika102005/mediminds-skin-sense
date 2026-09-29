import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/languageContext";
import {
  DISCLAIMER,
  REFERRAL_THRESHOLD,
  THRESHOLD_SOURCE,
  type LesionClass,
  type Probabilities,
} from "@/lib/screeningPolicy";

export type PredictionResult = {
  screeningId?: string;
  predictedClass: LesionClass;
  className: string;
  /** 0..100 percentage of the predicted pattern. */
  confidence: number;
  /** Full 7-class softmax distribution (fractions 0..1). */
  probabilities: Probabilities;
  /** p(mel)+p(bcc)+p(akiec), fraction 0..1. */
  malignantProb: number;
  /** True when malignantProb >= 0.35 (frozen val threshold). */
  referred: boolean;
  referralThreshold: number;
  referralCategory?: "LOWER_CONCERN" | "NEEDS_ATTENTION" | "REQUIRES_PROFESSIONAL_REVIEW";
  statusMessage?: string;
  top3: { label: LesionClass; name: string; prob: number }[];
  /** Base64 PNGs from backend Grad-CAM (never a diagnosis locator). */
  gradcamHeatmap?: string;
  gradcamOverlay?: string;
  gradcamExplanation?: string;
  /** Original uploaded image as a data URL, for side-by-side comparison. */
  imageDataUrl?: string;
  /** True when produced by the local demo sampler (no backend yet). */
  demoMode?: boolean;
};

interface ResultCardProps {
  result: PredictionResult;
  onViewGradCam?: () => void;
}

const ResultCard = ({ result, onViewGradCam }: ResultCardProps) => {
  const { language } = useLanguage();
  const hi = language === "hi";
  const category =
    result.referralCategory ||
    (result.referred || result.malignantProb >= 0.35
      ? "REQUIRES_PROFESSIONAL_REVIEW"
      : result.malignantProb >= 0.20
      ? "NEEDS_ATTENTION"
      : "LOWER_CONCERN");

  const headerTone =
    category === "REQUIRES_PROFESSIONAL_REVIEW"
      ? "bg-[#F9ECEE] border-[#E8BCC3] text-[#7A2E3A]"
      : category === "NEEDS_ATTENTION"
      ? "bg-[#FBF4E6] border-[#E4CDA3] text-[#7A5A1E]"
      : "bg-[#EEF7F5] border-[#DCE7E5] text-[#17324D]";

  const statusDot =
    category === "REQUIRES_PROFESSIONAL_REVIEW"
      ? "bg-[#B84A5A]"
      : category === "NEEDS_ATTENTION"
      ? "bg-[#C98A2E]"
      : "bg-[#2E8B72]";

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden shadow-sm border border-[#DCE7E5] rounded-2xl bg-white">
      <div className={`${headerTone} border-b px-6 py-5`}>
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider opacity-90">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
          <span>{hi ? "एआई-सहायित स्क्रीनिंग पैटर्न • यह निदान नहीं है" : "AI-assisted screening pattern • Not a diagnosis"}</span>
        </div>
        <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight mt-2 leading-tight">
          {result.predictedClass.toUpperCase()}
        </h2>
        <p className="text-[15px] sm:text-[16px] font-medium mt-0.5 opacity-90">{result.className}</p>
        <p className="text-[14px] mt-2 opacity-80">
          {hi ? "पैटर्न समानता कॉन्फिडेंस:" : "Pattern similarity confidence:"}{" "}
          <strong>{result.confidence.toFixed(1)}%</strong>
        </p>
      </div>
      <CardContent className="p-6 space-y-5">
        {/* Referral Status Block */}
        {category === "REQUIRES_PROFESSIONAL_REVIEW" && (
          <div
            role="alert"
            className="rounded-xl border border-[#E8BCC3] bg-[#F9ECEE] p-4"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B84A5A] animate-pulse"></span>
              <p className="font-bold text-sm text-[#7A2E3A]">
                {hi ? "पेशेवर समीक्षा आवश्यक" : "Requires Professional Review"}
              </p>
            </div>
            <p className="text-xs text-[#7A2E3A] mt-1.5 leading-relaxed">
              {hi
                ? "योग्य स्वास्थ्य पेशेवर से मूल्यांकन कराएँ। इस स्क्रीनिंग का स्कोर p(mel+bcc+akiec) "
                : "Arrange assessment by a qualified healthcare professional. This screening score p(mel+bcc+akiec) of "}
              <strong>{pct(result.malignantProb)}</strong>
              {hi
                ? " मान्य 35% संवेदनशीलता रेफरल थ्रेशोल्ड के बराबर या उससे अधिक है। यह एआई-सहायित स्क्रीनिंग परिणाम है, कैंसर निदान नहीं।"
                : " meets or exceeds the validated 35% sensitivity referral operating threshold. This is an AI-assisted screening result, not a cancer diagnosis."}
            </p>
          </div>
        )}

        {category === "NEEDS_ATTENTION" && (
          <div
            role="alert"
            className="rounded-xl border border-[#E4CDA3] bg-[#FBF4E6]/70 p-4"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C98A2E]"></span>
              <p className="font-bold text-sm text-[#7A5A1E]">
                {hi ? "ध्यान देने योग्य" : "Needs Attention"}
              </p>
            </div>
            <p className="text-xs text-[#7A5A1E] mt-1.5 leading-relaxed">
              {hi
                ? "यदि तिल का आकार, आकृति या रंग बदल रहा हो अथवा लक्षण बने रहें तो पेशेवर समीक्षा पर विचार करें। स्क्रीनिंग स्कोर p(mel+bcc+akiec): "
                : "Consider professional review if the lesion changes in size, shape, color, or symptoms persist. Screening score p(mel+bcc+akiec): "}
              <strong>{pct(result.malignantProb)}</strong>
              {hi
                ? "। यह एआई-सहायित स्क्रीनिंग परिणाम है, निदान नहीं।"
                : ". This is an AI-assisted screening result, not a diagnosis."}
            </p>
          </div>
        )}

        {category === "LOWER_CONCERN" && (
          <div
            role="alert"
            className="rounded-xl border border-[#DCE7E5] bg-[#EEF7F5]/70 p-4"
          >
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B72]"></span>
              <p className="font-bold text-sm text-[#1F6B58]">
                {hi ? "कम चिंता का स्तर" : "Lower Concern"}
              </p>
            </div>
            <p className="text-xs text-[#41685F] mt-1.5 leading-relaxed">
              {hi
                ? "नियमित त्वचा जागरूकता जारी रखें और ABCDE नियम से बदलाव पर नज़र रखें। स्क्रीनिंग स्कोर p(mel+bcc+akiec): "
                : "Continue routine skin awareness and monitor changes using the ABCDE guidelines. Screening score p(mel+bcc+akiec): "}
              <strong>{pct(result.malignantProb)}</strong>
              {hi
                ? "। यह रोग की अनुपस्थिति की गारंटी नहीं है।"
                : ". This does not guarantee absence of disease."}
            </p>
          </div>
        )}


        <div className="border-t border-b border-[#DCE7E5] py-4">
          <h3 className="font-bold text-[19px] text-[#17324D] mb-3">
            {hi ? "सबसे मिलते-जुलते पैटर्न" : "Most similar patterns"}
          </h3>
          <div className="space-y-3">
            {result.top3.map((t, i) => (
              <div key={t.label}>
                <div className="flex justify-between text-[14px] mb-1">
                  <span className="font-semibold text-[#17324D]">
                    {i + 1}. {t.label} — {t.name}
                  </span>
                  <span className="font-bold text-[#0F766E]">{pct(t.prob)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#EEF7F5] border border-[#DCE7E5] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0F766E]"
                    style={{ width: `${Math.max(4, t.prob * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-[#7B8B98] mt-3">{THRESHOLD_SOURCE}</p>
        </div>

        {result.imageDataUrl && (
          <div className="border-t border-[#DCE7E5] pt-4">
            <h3 className="font-bold text-[19px] text-[#17324D] mb-2">
              {hi ? "मूल छवि" : "Original image"}
            </h3>
            <img
              src={result.imageDataUrl}
              alt="Uploaded skin lesion"
              className="rounded-xl w-full max-h-72 object-contain bg-[#F7FAF9] border border-[#DCE7E5]"
            />
          </div>
        )}

        {(result.gradcamOverlay || result.gradcamHeatmap) && (
          <div className="border-t border-[#DCE7E5] pt-4">
            <h3 className="font-bold text-[19px] text-[#17324D] mb-2">
              {hi ? "एआई व्याख्या (Grad-CAM)" : "AI explanation (Grad-CAM)"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {result.gradcamOverlay && (
                <figure>
                  <img
                    src={`data:image/png;base64,${result.gradcamOverlay}`}
                    alt="Grad-CAM overlay"
                    className="rounded-xl w-full border border-[#DCE7E5]"
                    loading="lazy"
                  />
                  <figcaption className="text-[13px] text-[#7B8B98] mt-1">
                    {hi ? "ओवरले" : "Overlay"}
                  </figcaption>
                </figure>
              )}
              {result.gradcamHeatmap && (
                <figure>
                  <img
                    src={`data:image/png;base64,${result.gradcamHeatmap}`}
                    alt="Grad-CAM heatmap"
                    className="rounded-xl w-full border border-[#DCE7E5]"
                    loading="lazy"
                  />
                  <figcaption className="text-[13px] text-[#7B8B98] mt-1">
                    {hi ? "हीटमैप" : "Heatmap"}
                  </figcaption>
                </figure>
              )}
            </div>
            <p className="text-[13px] text-[#7B8B98] mt-2 leading-relaxed">
              {result.gradcamExplanation ??
                (hi
                  ? "हाइलाइट किया गया क्षेत्र दर्शाता है कि मॉडल के अनुमान में किस भाग का सबसे अधिक योगदान रहा। यह एआई विज़ुअलाइज़ेशन है, निदान नहीं।"
                  : "The highlighted region shows the area that contributed most to the model's prediction. It is an AI visualization, not a diagnosis.")}
            </p>
          </div>
        )}

        <div className="bg-[#F7FAF9] border border-[#DCE7E5] rounded-xl p-3.5 text-xs text-[#5F7182] leading-relaxed">
          <p className="font-semibold text-[#17324D] mb-0.5">
            {hi ? "चिकित्सीय अस्वीकरण:" : "Clinical Disclaimer:"}
          </p>
          <p>{DISCLAIMER}</p>
        </div>

        {onViewGradCam && (
          <Button
            onClick={onViewGradCam}
            className="w-full bg-[#0F766E] hover:bg-[#0C655E] text-white font-medium py-3 text-sm rounded-xl"
          >
            {hi ? "एआई व्याख्या देखें (Grad-CAM हीटमैप) →" : "View AI Explanation (Grad-CAM Heatmap) →"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultCard;

