import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MedicalPage } from "@/components/medical/MedicalPage";
import { SectionHeading } from "@/components/medical/SectionHeading";
import { DisclaimerBanner } from "@/components/medical/DisclaimerBanner";
import { useWorkflowCopy, WORKFLOW_STEPS } from "@/components/medical/workflow";
import { useLanguage } from "@/lib/languageContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const HowItWorksPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const hi = language === "hi";
  const steps = useWorkflowCopy();

  return (
    <MedicalPage
      eyebrow={hi ? "सरल चिकित्सा प्रक्रिया" : "Simple medical workflow"}
      title={hi ? "यह कैसे काम करता है" : "How It Works"}
      subtitle={
        hi
          ? "छवि अपलोड से लेकर पेशेवर परामर्श तक — 4 स्पष्ट चरणों में पारदर्शी स्क्रीनिंग।"
          : "Transparent screening in 4 clear steps — from image upload to professional consultation."
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s, i) => {
          const Icon = WORKFLOW_STEPS[i].icon;
          return (
            <Card key={s.title} className="med-card p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-bold px-2.5 py-1 rounded-lg bg-[#EEF7F5] text-[#0F766E] border border-[#DCE7E5]">
                  {WORKFLOW_STEPS[i].num}
                </span>
                <div className="w-11 h-11 rounded-xl bg-[#0F766E] text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-[19px] font-bold text-[#17324D] mb-1.5">{s.title}</h3>
              <p className="text-[15px] text-[#5F7182] leading-relaxed">{s.desc}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="med-card p-6 bg-white lg:col-span-2">
          <SectionHeading
            eyebrow={hi ? "अच्छी तस्वीर हेतु सुझाव" : "Photo tips"}
            title={hi ? "सटीक स्क्रीनिंग के लिए स्पष्ट तस्वीर लें" : "Take a clear photo for reliable screening"}
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[15px] text-[#5F7182]">
            {[
              hi ? "समान रोशनी, तेज फ्लैश से बचें" : "Use even lighting; avoid harsh flash glare",
              hi ? "कैमरा स्थिर रखें, फोकस तेज हो" : "Hold the camera steady with sharp focus",
              hi ? "घाव फ्रेम के केंद्र में हो" : "Center the lesion in the frame",
              hi ? "बहुत दूर या अत्यधिक ज़ूम से बचें" : "Avoid excessive distance or heavy digital zoom",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 bg-[#F7FAF9] border border-[#DCE7E5] rounded-xl px-3.5 py-3">
                <CheckCircle2 className="w-4 h-4 text-[#2E8B72] mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="med-card p-6 bg-[#0F766E] !border-[#0F766E] text-white">
          <h3 className="text-[21px] font-bold mb-2">{hi ? "स्क्रीनिंग शुरू करने के लिए तैयार हैं?" : "Ready to start screening?"}</h3>
          <p className="text-[15px] text-white/85 leading-relaxed mb-5">
            {hi ? "रिपोर्ट सहेजी जाती है और बाद में पेशेवर से साझा की जा सकती है।" : "Reports are saved and can be shared with a professional later."}
          </p>
          <Button onClick={() => navigate("/patient/skin-check")} className="w-full bg-white text-[#0F766E] hover:bg-[#EEF7F5] font-bold rounded-xl py-3 h-auto text-[15px]">
            {hi ? "त्वचा स्क्रीनिंग शुरू करें" : "Start Skin Screening"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>

      <div className="mt-6">
        <DisclaimerBanner />
      </div>
    </MedicalPage>
  );
};

export default HowItWorksPage;
