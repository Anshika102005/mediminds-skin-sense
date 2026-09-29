import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultCard, { PredictionResult } from "@/components/ResultCard";
import { useLanguage } from "@/lib/languageContext";
import { API_BASE, screeningToPrediction } from "@/lib/api";
import { Eye, History, RefreshCw, ShieldAlert, ArrowLeft } from "lucide-react";

const ResultsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screeningId = searchParams.get("id");
  const { t, language } = useLanguage();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      // 1. Try session storage
      const stored = sessionStorage.getItem("diagnosis-result");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setResult(parsed);
          setLoading(false);
          return;
        } catch {
          // fallback
        }
      }

      // 2. Try fetching from backend if id is provided
      if (screeningId) {
        try {
          const res = await fetch(`${API_BASE}/api/screenings/${screeningId}`);
          if (res.ok) {
            const data = await res.json();
            const mapped = screeningToPrediction(data);
            setResult(mapped);
            setLoading(false);
            return;
          }
        } catch {
          // ignore error
        }
      }

      setLoading(false);
    };

    loadResult();
  }, [screeningId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7FAF9]">
        <Header />
        <main className="flex-grow med-container py-16 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin inline-block w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm text-[#5F7182]">
              {language === "hi" ? "स्क्रीनिंग परिणाम लोड हो रहा है..." : "Loading screening result..."}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7FAF9]">
        <Header />
        <main className="flex-grow med-container py-16 flex items-center justify-center">
          <div className="text-center max-w-md bg-white border border-[#DCE7E5] rounded-2xl p-8 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-[#7B8B98] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#17324D] mb-1">
              {language === "hi" ? "कोई परिणाम उपलब्ध नहीं है" : "No Screening Result Found"}
            </h2>
            <p className="text-xs text-[#7B8B98] mb-6 leading-relaxed">
              {language === "hi"
                ? "कृपया पहले त्वचा की तस्वीर अपलोड करके एआई स्क्रीनिंग शुरू करें।"
                : "Please upload a skin image to run an AI-assisted screening."}
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
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleOpenGradCam = () => {
    const targetUrl = result.screeningId ? `/screening/gradcam?id=${result.screeningId}` : "/screening/gradcam";
    navigate(targetUrl);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7FAF9]">
      <Header />

      <main className="flex-grow med-container py-10 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF7F5] text-[#17324D] border border-[#DCE7E5] mb-2">
            <span>EfficientNetB0 • 0.35 Malignant Referral Threshold</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] tracking-tight">
            {language === "hi" ? "आपकी त्वचा स्क्रीनिंग रिपोर्ट" : "Skin Screening Assessment Report"}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F7182] mt-1 max-w-xl mx-auto">
            {t("heroNotice")}
          </p>
        </div>

        {/* Primary Result Card */}
        <div className="mb-8">
          <ResultCard result={result} onViewGradCam={handleOpenGradCam} />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3 justify-center max-w-xl mx-auto mb-10">
          <Button
            onClick={handleOpenGradCam}
            className="bg-[#0F766E] hover:bg-[#0C655E] text-white text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>{t("gradcamTitle")}</span>
          </Button>
          <Button
            onClick={() => navigate("/patient/dashboard")}
            variant="outline"
            className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl px-5 py-2.5"
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            <span>{t("btnViewHistory")}</span>
          </Button>
          <Button
            onClick={() => navigate("/diagnosis")}
            variant="outline"
            className="text-xs border-[#DCE7E5] text-[#5F7182] rounded-xl px-4 py-2.5"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>{t("heroCtaPrimary")}</span>
          </Button>
        </div>

        {/* Mandatory Clinical Disclaimer Banner */}
        <div className="bg-[#FBF4E6] border border-[#E4CDA3] p-4 rounded-2xl max-w-xl mx-auto flex items-start space-x-3 text-xs text-[#7A5A1E] leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-[#C98A2E] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block mb-0.5">
              {language === "hi" ? "महत्वपूर्ण चिकित्सीय सूचना:" : "Mandatory Medical Notice:"}
            </strong>
            <span>{t("disclaimerBanner")}</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResultsPage;
