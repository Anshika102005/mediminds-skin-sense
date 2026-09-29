import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileDown, History, RefreshCw, Eye, ShieldCheck, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";
import { API_BASE, type ScreeningApiResponse } from "@/lib/api";

export const GradCamPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screeningId = searchParams.get("id");
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    originalImage?: string;
    heatmap?: string;
    overlay?: string;
    prediction?: string;
    className?: string;
    confidence?: number;
    malignantProb?: number;
    referred?: boolean;
    referralCategory?: string;
    explanation?: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // 1. Try session storage first
      const stored = sessionStorage.getItem("diagnosis-result");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.gradcamOverlay || parsed.gradcamHeatmap || parsed.imageDataUrl) {
            setData({
              originalImage: parsed.imageDataUrl,
              heatmap: parsed.gradcamHeatmap,
              overlay: parsed.gradcamOverlay,
              prediction: parsed.predictedClass,
              className: parsed.className,
              confidence: parsed.confidence,
              malignantProb: parsed.malignantProb,
              referred: parsed.referred,
              referralCategory: parsed.referralCategory,
              explanation: parsed.gradcamExplanation,
            });
            setLoading(false);
            return;
          }
        } catch {
          // fallback to backend API
        }
      }

      // 2. If ID in URL, fetch from backend API
      if (screeningId) {
        try {
          const res = await fetch(`${API_BASE}/api/screenings/${screeningId}`);
          if (res.ok) {
            const apiData = await res.json();
            setData({
              originalImage: apiData.image_b64,
              heatmap: apiData.gradcam_heatmap_b64 || apiData.gradcam_heatmap_png_b64,
              overlay: apiData.gradcam_overlay_b64 || apiData.gradcam_overlay_png_b64,
              prediction: apiData.prediction,
              className: apiData.class_name,
              confidence: (apiData.confidence <= 1.0 ? apiData.confidence * 100 : apiData.confidence),
              malignantProb: apiData.malignant_prob,
              referred: apiData.malignant_referral,
              referralCategory: apiData.screening_status,
              explanation: apiData.gradcam_explanation,
            });
            setLoading(false);
            return;
          }
        } catch {
          // ignore error
        }
      }

      setLoading(false);
    };

    loadData();
  }, [screeningId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
        <Header />
        <main className="flex-1 med-container py-16 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#5F7182]">
              {language === "hi" ? "व्याख्या मैप लोड हो रहे हैं..." : "Loading explainability maps..."}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
        <Header />
        <main className="flex-1 med-container py-16 flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center bg-white border border-[#DCE7E5] shadow-sm rounded-2xl">
            <AlertCircle className="w-12 h-12 text-[#7B8B98] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#17324D] mb-1">
              {language === "hi" ? "कोई सक्रिय स्क्रीनिंग नहीं मिली" : "No Active Screening Record"}
            </h2>
            <p className="text-xs text-[#7B8B98] mb-6 leading-relaxed">
              {language === "hi"
                ? "कृपया पहले त्वचा की तस्वीर अपलोड करके एआई स्क्रीनिंग चलाएँ।"
                : "Please run an AI skin screening first or select a record from your screening history."}
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => navigate("/diagnosis")}
                className="w-full bg-[#0F766E] text-white text-xs py-2.5 rounded-xl"
              >
                {t("heroCtaPrimary")}
              </Button>
              <Button
                onClick={() => navigate("/patient/dashboard")}
                variant="outline"
                className="w-full text-xs py-2.5 rounded-xl border-[#DCE7E5]"
              >
                {t("btnViewHistory")}
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="flex-1 med-container py-10 max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#DCE7E5] gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF7F5] text-[#17324D] border border-[#DCE7E5] mb-2">
              <Eye className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{t("gradcamTitle")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] tracking-tight">
              {language === "hi" ? "एआई विज़ुअल स्पष्टीकरण (Grad-CAM)" : "AI Visual Explanation (Grad-CAM)"}
            </h1>
            <p className="text-xs sm:text-sm text-[#5F7182] mt-1">
              {language === "hi"
                ? "मॉडल ने त्वचा की तस्वीर के किन हिस्सों पर ध्यान केंद्रित किया, इसकी पारदर्शी जांच।"
                : "Inspect the anatomical image regions that most strongly guided the neural network prediction."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/results")}
              className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              {t("btnBackToResult")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              {t("btnSaveReport")}
            </Button>
          </div>
        </div>

        {/* Screening Summary Pill */}
        <div className="bg-white border border-[#DCE7E5] rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-[#7B8B98] uppercase tracking-wider block">
              {language === "hi" ? "स्क्रीनिंग पैटर्न" : "Identified Pattern"}
            </span>
            <div className="text-lg font-bold text-[#17324D] mt-0.5">
              {data.className} ({data.prediction?.toUpperCase()})
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-[#7B8B98] block">Confidence</span>
              <span className="font-semibold text-[#17324D]">
                {data.confidence ? `${data.confidence.toFixed(1)}%` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[#7B8B98] block">Sensitivity Risk (mel+bcc+akiec)</span>
              <span className="font-semibold text-[#17324D]">
                {data.malignantProb ? `${(data.malignantProb * 100).toFixed(1)}%` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[#7B8B98] block">Review Threshold</span>
              <span className="font-semibold text-[#17324D]">35.0% (Frozen)</span>
            </div>
          </div>
        </div>

        {/* 3-Card Visual Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Original Image */}
          <Card className="p-4 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DCE7E5]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#5F7182]">
                  1. {t("gradcamOriginal")}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-[#EEF7F5] text-[#5F7182] rounded-md">
                  Input
                </span>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[#EEF7F5] border border-[#DCE7E5] flex items-center justify-center">
                {data.originalImage ? (
                  <img
                    src={data.originalImage.startsWith("data:") ? data.originalImage : `data:image/png;base64,${data.originalImage}`}
                    alt="Original Skin Lesion"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-xs text-[#7B8B98]">Image data unavailable</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#7B8B98] mt-3">
              Standard RGB macroscopic/dermoscopic lesion capture.
            </p>
          </Card>

          {/* Card 2: Heatmap */}
          <Card className="p-4 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DCE7E5]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#5F7182]">
                  2. {t("gradcamHeatmap")}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-[#EEF7F5] text-[#5F7182] rounded-md">
                  Attention Map
                </span>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[#0F766E] border border-[#DCE7E5] flex items-center justify-center">
                {data.heatmap ? (
                  <img
                    src={data.heatmap.startsWith("data:") ? data.heatmap : `data:image/png;base64,${data.heatmap}`}
                    alt="Grad-CAM Heatmap"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-xs text-[#7B8B98]">Heatmap unavailable</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#7B8B98] mt-3">
              Gradient-weighted activations from EfficientNetB0 top conv layer.
            </p>
          </Card>

          {/* Card 3: Overlay */}
          <Card className="p-4 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DCE7E5]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#5F7182]">
                  3. {t("gradcamOverlay")}
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-[#EEF7F5] text-[#0F766E] rounded-md font-semibold">
                  JET 45% Overlay
                </span>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[#EEF7F5] border border-[#DCE7E5] flex items-center justify-center">
                {data.overlay ? (
                  <img
                    src={data.overlay.startsWith("data:") ? data.overlay : `data:image/png;base64,${data.overlay}`}
                    alt="Grad-CAM Overlay"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-xs text-[#7B8B98]">Overlay unavailable</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#7B8B98] mt-3">
              Blended view showing attention contours overlaid on lesion structure.
            </p>
          </Card>
        </div>

        {/* Clear Explanation Box */}
        <div className="bg-white border border-[#DCE7E5] rounded-2xl p-6 shadow-sm space-y-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#17324D] mb-1">
                {language === "hi" ? "यह विज़ुअलाइज़ेशन क्या दर्शाता है?" : "What Does This Visualization Show?"}
              </h3>
              <p className="text-xs sm:text-sm text-[#5F7182] leading-relaxed">
                {t("gradcamExplanationText")}
              </p>
            </div>
          </div>

          <div className="border-t border-[#DCE7E5] pt-4 flex items-center space-x-2 text-xs text-[#7B8B98]">
            <ShieldCheck className="w-4 h-4 text-[#2E8B72] flex-shrink-0" />
            <span>
              {language === "hi"
                ? "यह दृश्य केवल निर्णय सहायता के लिए है। यह किसी भी स्थिति में चिकित्सक की शारीरिक जांच का विकल्प नहीं है।"
                : "This visualization is for decision support only and must always be evaluated in conjunction with in-person clinical examination."}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <Button
            onClick={() => navigate("/results")}
            variant="outline"
            className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl px-5 py-2.5 h-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            {t("btnBackToResult")}
          </Button>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/patient/dashboard")}
              className="bg-[#0F766E] hover:bg-[#0C655E] text-white text-xs font-semibold rounded-xl px-5 py-2.5 h-auto flex items-center space-x-1.5"
            >
              <History className="w-3.5 h-3.5 mr-1" />
              <span>{t("btnViewHistory")}</span>
            </Button>
            <Button
              onClick={() => navigate("/diagnosis")}
              variant="outline"
              className="border-[#DCE7E5] text-[#5F7182] text-xs font-semibold rounded-xl px-4 py-2.5 h-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>{t("heroCtaPrimary")}</span>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GradCamPage;
