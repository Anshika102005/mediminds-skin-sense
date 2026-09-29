import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { RoleSelectModal } from "../components/RoleSelectModal";
import { AbcdeGuide } from "../components/AbcdeGuide";
import { WORKFLOW_STEPS, useWorkflowCopy } from "../components/medical/workflow";
import { CLINICAL_IMAGES } from "../components/medical/images";
import { DisclaimerBanner } from "../components/medical/DisclaimerBanner";
import { SectionHeading } from "../components/medical/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/languageContext";
import { useAuth } from "@/lib/authContext";
import {
  ShieldCheck, ArrowRight, CheckCircle2, ScanSearch, FileText,
  History, Stethoscope, Languages, Eye, Sun,
} from "lucide-react";

const HomePage: React.FC = () => {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const { t, language } = useLanguage();
  const { isAuthenticated, isProfessional } = useAuth();
  const navigate = useNavigate();
  const hi = language === "hi";
  const steps = useWorkflowCopy();
  const goScreening = () => {
    if (isAuthenticated) navigate(isProfessional ? "/professional/dashboard" : "/patient/skin-check");
    else setIsRoleModalOpen(true);
  };
  const bullets = hi ? [
    "हल्की मेडिकल रिपोर्ट — डरावने गहरे-लाल कार्ड नहीं",
    "शीर्ष-3 पैटर्न और स्पष्ट समीक्षा मार्गदर्शन",
    "सहेजी गई रिपोर्ट, रोगी इतिहास और पेशेवर समीक्षा",
    "सम्पूर्ण जागरूकता सामग्री — English और हिन्दी में",
  ] : [
    "Light medical reports — no alarming dark-red cards",
    "Top-3 similar patterns with clear review guidance",
    "Saved reports, patient history and professional review",
    "Complete awareness content in English and Hindi",
  ];
  const services = [
    {
      icon: ScanSearch,
      title: hi ? "एआई-सहायित त्वचा स्क्रीनिंग" : "AI-assisted skin screening",
      desc: hi
        ? "EfficientNetB0 मॉडल द्वारा त्वचा की छवि का विश्लेषण, टेस्ट-टाइम ऑगमेंटेशन के साथ।"
        : "Lesion image analysis with the EfficientNetB0 model and test-time augmentation.",
    },
    {
      icon: Eye,
      title: hi ? "एक्सप्लेनेबल एआई (Grad-CAM)" : "Explainable AI (Grad-CAM)",
      desc: hi
        ? "मॉडल के अनुमान में योगदान देने वाले क्षेत्र का हीटमैप — डॉक्टर की जांच के लिए।"
        : "Heatmaps of the region that influenced the prediction, for clinician inspectability.",
    },
    {
      icon: FileText,
      title: hi ? "संरचित स्क्रीनिंग रिपोर्ट" : "Structured screening report",
      desc: hi
        ? "पहचाना गया पैटर्न, कॉन्फिडेंस, टॉप-3 समानता और स्पष्ट समीक्षा मार्गदर्शन।"
        : "Pattern, confidence, top-3 similarity and clear professional review guidance.",
    },
    {
      icon: History,
      title: hi ? "सहेजा गया इतिहास" : "Saved screening history",
      desc: hi
        ? "अपनी पिछली स्क्रीनिंग और रिपोर्ट रोगी डैशबोर्ड में सुरक्षित रखें।"
        : "Keep previous screenings and reports organised in your patient dashboard.",
    },
    {
      icon: Stethoscope,
      title: hi ? "पेशेवर समीक्षा" : "Professional review",
      desc: hi
        ? "अधिकृत डॉक्टर और नर्स फ्लैग किए गए मामलों की समीक्षा कर सकते हैं।"
        : "Authorized doctors and nurses can review flagged screening records.",
    },
    {
      icon: Languages,
      title: hi ? "हिन्दी और English" : "Hindi and English",
      desc: hi
        ? "जागरूकता सामग्री और पूरा इंटरफ़ेस दोनों भाषाओं में उपलब्ध।"
        : "Awareness content and the complete interface available in both languages.",
    },
  ];
  const stats = [
    { value: t("stat1Value"), label: t("stat1Label"), source: t("stat1Source") },
    { value: t("stat2Value"), label: t("stat2Label"), source: t("stat2Source") },
    { value: t("stat3Value"), label: t("stat3Label"), source: t("stat3Source") },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />
      <main className="flex-1">
        <section className="bg-white border-b border-[#DCE7E5]">
          <div className="med-container py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-[#EEF7F5] border border-[#DCE7E5] px-3.5 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider text-[#0F766E]">
                <ShieldCheck className="w-4 h-4" />
                {hi ? "एआई-सहायित त्वचा स्क्रीनिंग" : "AI-Assisted Skin Screening"}
              </span>
              <h1 className="text-[38px] sm:text-[50px] lg:text-[58px] font-bold tracking-tight leading-[1.08] mt-4 text-[#17324D]">
                {hi ? "अपनी त्वचा के स्वास्थ्य को समझें" : "Understand your skin health"}
                <span className="block text-[#0F766E]">{hi ? "विशेषज्ञ मार्गदर्शन के साथ" : "with expert-guided screening"}</span>
              </h1>
              <p className="text-[17px] sm:text-[18px] text-[#5F7182] leading-relaxed mt-4 max-w-xl">
                {hi
                  ? "AI-सहायित इमेज स्क्रीनिंग से उन त्वचा पैटर्न की पहचान में मदद लें जिन पर पेशेवर ध्यान आवश्यक हो सकता है।"
                  : "Understand your skin health with AI-assisted image screening designed to help identify patterns that may require professional attention."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button size="lg" onClick={goScreening} className="med-btn-primary text-[15px] px-7 py-3.5 h-auto shadow-sm">
                  <span>{hi ? "त्वचा स्क्रीनिंग शुरू करें" : "Start Skin Screening"}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl border-[#DCE7E5] text-[#17324D] bg-white hover:bg-[#EEF7F5] font-semibold text-[15px] px-7 py-3.5 h-auto">
                  <Link to="/awareness">{hi ? "त्वचा स्वास्थ्य के बारे में जानें" : "Learn About Skin Health"}</Link>
                </Button>
              </div>
              <div className="mt-6 max-w-xl"><DisclaimerBanner compact /></div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#5F7182]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> EfficientNetB0</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> Grad-CAM explainability</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#0F766E]" /> English + हिन्दी</span>
              </div>
            </div>
            <div>
              <div className="relative pb-8">
                <img src={CLINICAL_IMAGES.heroDoctor} alt="Dermatologist consulting patient" className="med-img w-full h-[320px] sm:h-[430px] border border-[#DCE7E5] shadow-lg" />
                <Card className="absolute bottom-0 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm p-4 bg-white border-[#DCE7E5] shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center"><ScanSearch className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[14px] font-bold text-[#17324D]">{hi ? "संरचित स्क्रीनिंग रिपोर्ट" : "Structured screening report"}</p>
                      <p className="text-[13px] text-[#5F7182]">{hi ? "पैटर्न, कॉन्फिडेंस, समीक्षा मार्गदर्शन" : "Pattern, confidence, review guidance"}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-[#F7FAF9]">
          <div className="med-container">
            <SectionHeading eyebrow={hi ? "4-चरणीय प्रक्रिया" : "4-step workflow"} title={hi ? "सरल, पारदर्शी स्क्रीनिंग प्रक्रिया" : "A simple, transparent screening process"} subtitle={hi ? "अपलोड से लेकर पेशेवर परामर्श तक।" : "From upload to professional consultation."} align="center" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((s, i) => {
                const Icon = WORKFLOW_STEPS[i].icon;
                return (
                  <Card key={s.title} className="med-card p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[13px] font-bold px-2.5 py-1 rounded-lg bg-[#EEF7F5] text-[#0F766E] border border-[#DCE7E5]">{WORKFLOW_STEPS[i].num}</span>
                      <span className="w-11 h-11 rounded-xl bg-[#0F766E] text-white flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                    </div>
                    <h3 className="text-[19px] font-bold text-[#17324D] mb-1.5">{s.title}</h3>
                    <p className="text-[15px] text-[#5F7182] leading-relaxed">{s.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="med-container">
            <SectionHeading
              eyebrow={hi ? "प्लेटफ़ॉर्म क्षमताएँ" : "Platform capabilities"}
              title={hi ? "स्क्रीनिंग से समीक्षा तक पूरा सहयोग" : "End-to-end support from screening to review"}
              subtitle={hi
                ? "यह प्लेटफ़ॉर्म निदान नहीं करता — यह प्रारंभिक पहचान और पेशेवर समीक्षा को जोड़ता है।"
                : "The platform does not diagnose — it supports early awareness and connects results with professional review."}
              align="center"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((s) => (
                <Card key={s.title} className="med-card p-6 bg-white">
                  <span className="w-11 h-11 rounded-xl bg-[#EEF7F5] text-[#0F766E] border border-[#DCE7E5] flex items-center justify-center mb-4">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-[18px] font-bold text-[#17324D] mb-1.5">{s.title}</h3>
                  <p className="text-[15px] text-[#5F7182] leading-relaxed">{s.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-[#F7FAF9] border-y border-[#DCE7E5]">
          <div className="med-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <img src={CLINICAL_IMAGES.doctorPatient} alt="Dermatologist examining patient" className="med-img w-full h-[300px] sm:h-[380px] border border-[#DCE7E5]" />
            <div>
              <SectionHeading eyebrow={hi ? "क्लीनिक जैसा अनुभव" : "Clinic-grade experience"} title={hi ? "शांत, विश्वसनीय चिकित्सा अनुभव" : "A calm, trustworthy medical experience"} />
              <ul className="space-y-3 mt-2">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[15px] text-[#17324D] bg-[#F7FAF9] border border-[#DCE7E5] rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] mt-1 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 bg-[#17324D]">
          <div className="med-container">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#7FC8BC]">
                <Sun className="w-4 h-4" />
                {hi ? "जागरूकता क्यों ज़रूरी है" : "Why awareness matters"}
              </span>
              <h2 className="text-[28px] sm:text-[34px] font-bold text-white tracking-tight mt-3">
                {hi ? "प्रारंभिक पहचान परिणाम बदल देती है" : "Early detection changes outcomes"}
              </h2>
              <p className="text-[16px] text-[#B9C8D4] leading-relaxed mt-3">
                {hi
                  ? "त्वचा कैंसर के बारे में जागरूकता, नियमित स्व-जांच और समय पर पेशेवर मूल्यांकन सबसे प्रभावी सुरक्षा है।"
                  : "Awareness, regular self-examination and timely professional assessment remain the most effective protection."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/15 rounded-2xl p-6">
                  <p className="text-[30px] font-bold text-white tracking-tight">{s.value}</p>
                  <p className="text-[15px] font-semibold text-[#DCE7E5] mt-1">{s.label}</p>
                  <p className="text-[12px] text-[#9FB3C2] leading-relaxed mt-2">{s.source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white border-t border-[#DCE7E5]">
          <div className="med-container">
            <AbcdeGuide />
          </div>
        </section>

        <section className="py-16 bg-[#F7FAF9]">
          <div className="med-container">
            <div className="rounded-3xl bg-[#0F766E] text-white px-6 py-12 sm:px-12 text-center">
              <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
                {hi ? "अपनी त्वचा की जांच आज शुरू करें" : "Start your skin screening today"}
              </h2>
              <p className="text-[16px] text-[#D9F0EC] leading-relaxed mt-3 max-w-2xl mx-auto">
                {hi
                  ? "कुछ मिनटों में AI-सहायित स्क्रीनिंग पूरी करें और अपनी रिपोर्ट सहेजें।"
                  : "Complete an AI-assisted screening in a few minutes and save your report for follow-up."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-7">
                <Button
                  size="lg"
                  onClick={goScreening}
                  className="bg-white text-[#0F766E] hover:bg-[#EEF7F5] font-semibold text-[15px] px-7 py-3.5 h-auto shadow-sm"
                >
                  <span>{hi ? "त्वचा स्क्रीनिंग शुरू करें" : "Start Skin Screening"}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white font-semibold text-[15px] px-7 py-3.5 h-auto"
                >
                  <Link to="/professionals">
                    {hi ? "स्वास्थ्य पेशेवरों के लिए" : "For Healthcare Professionals"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <RoleSelectModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />
    </div>
  );
};

export default HomePage;
