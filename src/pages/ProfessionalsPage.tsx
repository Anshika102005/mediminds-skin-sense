import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MedicalPage } from "@/components/medical/MedicalPage";
import { SectionHeading } from "@/components/medical/SectionHeading";
import { CLINICAL_IMAGES } from "@/components/medical/images";
import { useLanguage } from "@/lib/languageContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, FileText, History, Stethoscope, ShieldCheck, Users } from "lucide-react";

export const ProfessionalsPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const hi = language === "hi";

  const features = [
    {
      icon: FileText,
      title: hi ? "संरचित एआई-सहायित रिपोर्ट" : "Structured AI-assisted reports",
      desc: hi ? "पैटर्न, कॉन्फिडेंस, टॉप-3 समानता और Grad-CAM व्याख्या।" : "Pattern, confidence, top-3 similarity and Grad-CAM explanation.",
    },
    {
      icon: History,
      title: hi ? "रोगी इतिहास और अनुवर्ती" : "Patient history & follow-up",
      desc: hi ? "सहेजे गए स्क्रीनिंग परिणाम और समीक्षा स्थिति एक स्थान पर।" : "Saved screening results and review status in one place.",
    },
    {
      icon: Users,
      title: hi ? "पेशेवर समीक्षा वर्कफ़्लो" : "Professional review workflow",
      desc: hi ? "फ्लैग किए गए रेफरल की समीक्षा करें, देखभाल योजना दर्ज करें।" : "Review flagged referrals and record care plans.",
    },
    {
      icon: ShieldCheck,
      title: hi ? "सुरक्षित भूमिका-आधारित पहुंच" : "Secure role-based access",
      desc: hi ? "संगठन खाते, हैश किए गए पासवर्ड, डेटा पृथक्करण।" : "Organization accounts, hashed passwords, data isolation.",
    },
  ];

  return (
    <MedicalPage
      eyebrow={hi ? "स्वास्थ्य पेशेवरों के लिए" : "For healthcare professionals"}
      title={hi ? "AI-सहायित स्क्रीनिंग के साथ स्वास्थ्य पेशेवरों का सहयोग" : "Supporting Healthcare Professionals with AI-Assisted Screening"}
      subtitle={
        hi
          ? "रोगी स्क्रीनिंग रिकॉर्ड देखें, रिपोर्ट की समीक्षा करें और अनुवर्ती प्रबंधन करें।"
          : "View patient screening records, review reports, and manage follow-up care."
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div>
          <img src={CLINICAL_IMAGES.consultation} alt="Clinician reviewing screening" className="med-img w-full h-[300px] sm:h-[360px] border border-[#DCE7E5] shadow-sm" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Card className="med-card p-5 bg-white">
              <Stethoscope className="w-5 h-5 text-[#0F766E] mb-2" />
              <p className="text-[22px] font-bold text-[#17324D]">0.35</p>
              <p className="text-[13px] text-[#5F7182]">{hi ? "पारदर्शी रेफरल थ्रेशोल्ड" : "Transparent referral threshold"}</p>
            </Card>
            <Card className="med-card p-5 bg-white">
              <Building2 className="w-5 h-5 text-[#0F766E] mb-2" />
              <p className="text-[22px] font-bold text-[#17324D]">EN + हिन्दी</p>
              <p className="text-[13px] text-[#5F7182]">{hi ? "द्विभाषी रोगी संवाद" : "Bilingual patient communication"}</p>
            </Card>
          </div>
        </div>
        <Card className="med-card p-7 sm:p-8 bg-white">
          <SectionHeading
            eyebrow={hi ? "पेशेवर पोर्टल" : "Professional portal"}
            title={hi ? "संगठन पंजीकृत करें या लॉगिन करें" : "Register your organization or log in"}
            subtitle={hi ? "दोनों बटन सही पेज पर ले जाते हैं।" : "Both buttons navigate to the correct professional entry point."}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/login?role=professional&mode=register")} className="med-btn-primary flex-1 py-3 h-auto text-[15px] font-bold">
              {hi ? "संगठन पंजीकृत करें" : "Register Organization"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => navigate("/login?role=professional")} variant="outline" className="flex-1 py-3 h-auto text-[15px] font-bold rounded-xl border-[#DCE7E5] text-[#17324D] hover:bg-[#EEF7F5]">
              {hi ? "पेशेवर लॉगिन" : "Professional Login"}
            </Button>
          </div>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-3 bg-[#F7FAF9] border border-[#DCE7E5] rounded-xl p-4">
                <span className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-[#17324D]">{f.title}</span>
                  <span className="block text-[14px] text-[#5F7182] mt-0.5">{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </MedicalPage>
  );
};

export default ProfessionalsPage;
