import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MedicalPage } from "@/components/medical/MedicalPage";
import { SectionHeading } from "@/components/medical/SectionHeading";
import { DisclaimerBanner } from "@/components/medical/DisclaimerBanner";
import { CLINICAL_IMAGES } from "@/components/medical/images";
import UploadImage from "@/components/UploadImage";
import type { PredictionResult } from "@/components/ResultCard";
import { API_BASE, screeningToPrediction } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useLanguage } from "@/lib/languageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PatientInfoForm from "@/components/PatientInfoForm";
import SymptomForm from "@/components/SymptomForm";
import {
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Upload,
  UserRound,
} from "lucide-react";

interface PatientInfo {
  name: string;
  age: string;
  gender: string;
}

export const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState("patientInfo");
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: user?.full_name || "",
    age: (user as any)?.age?.toString() || "",
    gender: (user as any)?.gender || "female",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState<{ selected: string[]; description: string }>({
    selected: [],
    description: "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityError, setQualityError] = useState<{
    message: string;
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    if (user?.full_name && !patientInfo.name) {
      setPatientInfo({
        name: user.full_name,
        age: (user as any)?.age?.toString() || "",
        gender: (user as any)?.gender || "female",
      });
    }
  }, [user]);

  const handlePatientInfoSubmit = (info: PatientInfo) => {
    setPatientInfo(info);
    setActiveTab("upload");
    toast.success("Patient details confirmed.");
  };

  const handleImageSelected = (file: File) => {
    setQualityError(null);
    setSelectedImage(file);
    toast.success("Skin lesion image uploaded.");
  };

  const handleSymptomSubmit = (selectedSymptoms: string[], description: string) => {
    setSymptoms({
      selected: selectedSymptoms,
      description,
    });
    toast.success("Symptom observations saved.");
  };

  const handleStartAnalysis = async () => {
    if (!selectedImage) {
      toast.error("Please upload or capture a skin lesion image.");
      setActiveTab("upload");
      return;
    }

    if (!patientInfo.name || !patientInfo.age || !patientInfo.gender) {
      toast.error("Please complete patient demographics first.");
      setActiveTab("patientInfo");
      return;
    }

    setIsAnalyzing(true);
    setQualityError(null);

    try {
      const form = new FormData();
      form.append("image", selectedImage);

      // Real backend inference calling trained EfficientNetB0 with frozen weights
      const res = await fetch(
        `${API_BASE}/api/screening/predict?use_tta=true&with_gradcam=true`,
        { method: "POST", body: form }
      );

      // Handle Image Quality Gate failures (422)
      if (res.status === 422) {
        const err = await res.json().catch(() => ({}));
        const recommendations =
          err?.detail?.recommendations || [
            "Use better lighting without harsh flash glare",
            "Keep camera steady to avoid motion blur",
            "Ensure the lesion is in focus and centered in the frame",
            "Avoid excessive distance or heavy digital zoom",
            "Retake the image with a clean camera lens",
          ];

        setQualityError({
          message:
            err?.detail?.error ||
            "Image quality is not sufficient for reliable AI-assisted screening.",
          recommendations,
        });
        setIsAnalyzing(false);
        setActiveTab("upload");
        toast.error("Image quality check failed. Please review the guidance below.");
        return;
      }

      if (!res.ok) {
        throw new Error(`Screening service returned error status ${res.status}`);
      }

      const data = await res.json();
      const apiResult: PredictionResult = screeningToPrediction(data);

      // Read original image as Data URL for persistent viewing
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) ?? "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(selectedImage);
      });

      // Persist to real backend SQLite database
      let savedScreeningId = "";
      try {
        const saveRes = await fetch(`${API_BASE}/api/patients/screenings/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: user?.patient_id || undefined,
            patient_name: patientInfo.name.trim(),
            patient_age: parseInt(patientInfo.age) || 30,
            patient_gender: patientInfo.gender,
            patient_phone: user?.phone || undefined,
            prediction: data.prediction,
            class_name: data.class_name,
            confidence: data.confidence,
            probabilities: data.probabilities,
            top_predictions: data.top_predictions,
            malignant_prob: data.malignant_prob,
            malignant_referral: data.malignant_referral,
            screening_status: data.screening_status,
            status_message: data.status_message,
            gradcam_overlay_png_b64: data.gradcam_overlay_png_b64,
            gradcam_heatmap_png_b64: data.gradcam_heatmap_png_b64,
            image_b64: imageDataUrl || null,
          }),
        });

        if (saveRes.ok) {
          const saveJson = await saveRes.json();
          savedScreeningId = saveJson.screening_id || "";
          apiResult.screeningId = savedScreeningId;
        }
      } catch {
        // Fallback continues with local session
      }

      // Store in session storage for instant retrieval
      sessionStorage.setItem(
        "diagnosis-result",
        JSON.stringify({ ...apiResult, imageDataUrl, screeningId: savedScreeningId })
      );
      sessionStorage.setItem("patient-info", JSON.stringify(patientInfo));

      setIsAnalyzing(false);
      const targetUrl = savedScreeningId ? `/results?id=${savedScreeningId}` : "/results";
      navigate(targetUrl);
    } catch (e) {
      setIsAnalyzing(false);
      toast.error(
        "Screening service unavailable. Please ensure the backend server is running on port 8000."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="flex-grow med-container py-10 max-w-4xl">
        {/* Authentication Notice if Guest */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-[#EEF7F5]/80 border border-[#DCE7E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-[#5F7182]">
              <Lock className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
              <span>
                {language === "hi"
                  ? "लॉग इन करके आप अपनी स्क्रीनिंग रिपोर्ट अपने व्यक्तिगत रोगी डैशबोर्ड में सहेज सकते हैं।"
                  : "Sign in or register to automatically link this screening to your personal patient health record."}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/login?role=patient&redirect=/patient/skin-check")}
              className="text-xs font-semibold border-[#DCE7E5] text-[#17324D] bg-white"
            >
              {t("authSignIn")}
            </Button>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF7F5] text-[#17324D] border border-[#DCE7E5] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>{language === "hi" ? "एआई-सहायित घाव स्क्रीनिंग" : "AI-Assisted Lesion Screening"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] tracking-tight">
            {language === "hi" ? "त्वचा घाव स्क्रीनिंग" : "Skin Lesion Screening"}
          </h1>
          <p className="text-xs sm:text-sm text-[#7B8B98] mt-1 max-w-xl mx-auto">
            {t("heroNotice")}
          </p>
        </div>

        {/* Quality Error Banner if failed */}
        {qualityError && (
          <div className="mb-8 p-5 bg-[#F9ECEE] border border-[#E8BCC3] rounded-2xl shadow-sm text-xs text-[#7A2E3A]">
            <div className="flex items-center space-x-2 font-bold text-sm mb-2 text-[#7A2E3A]">
              <ShieldAlert className="w-5 h-5 text-[#B84A5A]" />
              <span>{t("qualityFailedTitle")}</span>
            </div>
            <p className="mb-3 leading-relaxed">{qualityError.message}</p>
            <div className="p-3 bg-white/80 rounded-xl border border-[#E8BCC3]">
              <span className="font-semibold block mb-1 text-[#17324D]">
                {language === "hi" ? "दोबारा प्रयास से पहले सुझाए गए कदम:" : "Recommended Actions Before Retrying:"}
              </span>
              <ul className="list-disc pl-5 space-y-1 text-[#5F7182]">
                {qualityError.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Multi-step Tabs */}
        <div className="max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#EEF7F5] p-1 border border-[#DCE7E5] rounded-xl">
              <TabsTrigger value="patientInfo" className="text-xs font-semibold rounded-lg">
                1. {language === "hi" ? "मरीज़ की जानकारी" : "Patient Details"}
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                disabled={!patientInfo.name}
                className="text-xs font-semibold rounded-lg"
              >
                2. {language === "hi" ? "तस्वीर अपलोड" : "Lesion Image"}
              </TabsTrigger>
              <TabsTrigger
                value="symptoms"
                disabled={!selectedImage}
                className="text-xs font-semibold rounded-lg"
              >
                3. {language === "hi" ? "समीक्षा और स्क्रीनिंग" : "Review & Screen"}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: PATIENT INFO */}
            <TabsContent value="patientInfo" className="mt-0">
              <PatientInfoForm
                onPatientInfoSubmit={handlePatientInfoSubmit}
                initialValues={patientInfo}
              />
            </TabsContent>

            {/* TAB 2: IMAGE UPLOAD & QUALITY */}
            <TabsContent value="upload" className="mt-0 space-y-6">
              <UploadImage onImageSelected={handleImageSelected} />

              {/* Pre-Screening Image Quality Tips Card */}
              <div className="bg-white border border-[#DCE7E5] rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#17324D]">
                  <Info className="w-4 h-4 text-[#0F766E]" />
                  <span>{language === "hi" ? "सटीक एआई स्क्रीनिंग हेतु गुणवत्ता दिशानिर्देश" : "Quality Guidelines for Accurate AI Screening"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5F7182]">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B72] mt-0.5 flex-shrink-0" />
                    <span>{language === "hi" ? <><strong>समान रोशनी:</strong> तेज फ्लैश या गहरी छाया के बिना दोबारा तस्वीर लें।</> : <><strong>Even Lighting:</strong> Retake without harsh flash glare or dark shadows.</>}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B72] mt-0.5 flex-shrink-0" />
                    <span>{language === "hi" ? <><strong>स्थिर फोकस:</strong> कैमरा स्थिर रखें; घाव के किनारे तेज दिखें।</> : <><strong>Steady Focus:</strong> Keep hands steady; edges of lesion must be sharp.</>}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B72] mt-0.5 flex-shrink-0" />
                    <span>{language === "hi" ? <><strong>केंद्र में घाव:</strong> लक्षित घाव छवि के मध्य भाग में हो।</> : <><strong>Centered Frame:</strong> The target lesion should occupy the central 60% of the image.</>}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B72] mt-0.5 flex-shrink-0" />
                    <span>{language === "hi" ? <><strong>स्पष्ट दूरी:</strong> अत्यधिक ज़ूम या धुंधलेपन से बचें।</> : <><strong>Clear Distance:</strong> Avoid macro-blur or excessive digital zoom.</>}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setActiveTab("symptoms")}
                  disabled={!selectedImage}
                  className="med-btn-primary text-xs px-6 py-2.5 h-auto font-semibold"
                >
                  <span>{language === "hi" ? "समीक्षा पर जाएँ" : "Continue to Review"}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: SYMPTOMS & INFERENCE */}
            <TabsContent value="symptoms" className="mt-0 space-y-6">
              <SymptomForm onSymptomSubmit={handleSymptomSubmit} />

              <Card className="p-6 bg-white border border-[#DCE7E5] rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-[#17324D] border-b border-[#DCE7E5] pb-3">
                  {language === "hi" ? "स्क्रीनिंग सबमिशन सारांश" : "Screening Submission Summary"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#7B8B98] block">{language === "hi" ? "मरीज़:" : "Patient:"}</span>
                    <span className="font-semibold text-[#17324D]">
                      {patientInfo.name}, {patientInfo.age} {language === "hi" ? "वर्ष" : "yrs"} ({patientInfo.gender})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#7B8B98] block">
                      {language === "hi" ? "अपलोड की गई छवि:" : "Uploaded Image:"}
                    </span>
                    <span className="font-semibold text-[#17324D]">
                      {selectedImage ? selectedImage.name : language === "hi" ? "कोई नहीं" : "None"}
                    </span>
                  </div>
                </div>

                {symptoms.selected.length > 0 && (
                  <div className="text-xs">
                    <span className="text-[#7B8B98] block mb-1">
                      {language === "hi" ? "बताए गए लक्षण:" : "Reported Symptoms:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {symptoms.selected.map((s, i) => (
                        <span
                          key={i}
                          className="bg-[#EEF7F5] text-[#5F7182] px-2 py-0.5 rounded-md font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#DCE7E5]">
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || !selectedImage}
                    className="med-btn-primary w-full font-semibold py-3.5 h-auto text-sm"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>
                          {language === "hi"
                            ? "घाव विशेषताओं और Grad-CAM का मूल्यांकन..."
                            : "Evaluating Lesion Features & Grad-CAM..."}
                        </span>
                      </span>
                    ) : (
                      language === "hi" ? "एआई-सहायित स्क्रीनिंग शुरू करें →" : "Start AI-Assisted Screening →"
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiagnosisPage;
