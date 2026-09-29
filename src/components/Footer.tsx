import { Link } from "react-router-dom";
import { Activity, HeartHandshake } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

const Footer = () => {
  const { t, language } = useLanguage();
  const hi = language === "hi";

  return (
    <footer className="bg-[#17324D] text-[#DCE7E5] pt-14 pb-8">
      <div className="med-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0F766E] flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-[19px] text-white tracking-tight block leading-tight">
                  MediMinds Skin Sense
                </span>
                <span className="text-[12px] text-[#9FB3C2]">
                  {hi ? "एआई-सहायित त्वचा स्क्रीनिंग प्लेटफ़ॉर्म" : "AI-Assisted Skin Screening Platform"}
                </span>
              </div>
            </div>
            <p className="text-[14px] text-[#B9C8D4] max-w-md leading-relaxed mb-4">
              {t("brandSubtitle")}
            </p>
            <div className="inline-flex items-center space-x-2 text-[12px] bg-white/10 text-white px-3 py-1.5 rounded-full border border-white/20">
              <HeartHandshake className="w-3.5 h-3.5 text-[#7FC8BC]" />
              <span>{t("accessSubtitle")}</span>
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">
              {hi ? "प्लेटफ़ॉर्म" : "Platform"}
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#B9C8D4]">
              <li><Link to="/" className="hover:text-white transition-colors">{t("navHome")}</Link></li>
              <li><Link to="/patient/skin-check" className="hover:text-white transition-colors">{t("navScreening")}</Link></li>
              <li><Link to="/awareness" className="hover:text-white transition-colors">{t("navAwareness")}</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">{t("navHowItWorks")}</Link></li>
              <li><Link to="/professionals" className="hover:text-white transition-colors">{t("navProfessionals")}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">
              {hi ? "कानूनी" : "Legal"}
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#B9C8D4]">
              <li><Link to="/privacy" className="hover:text-white transition-colors">{t("legalPrivacyTitle")}</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">{t("legalTermsTitle")}</Link></li>
            </ul>
            <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 text-[12px] text-[#DCE7E5] leading-relaxed mt-4">
              <p className="font-semibold text-white mb-1">AI-Assisted Screening Only</p>
              <p>{t("disclaimerBanner")}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 mt-10 pt-5 flex flex-col sm:flex-row justify-between items-center text-[12px] text-[#9FB3C2]">
          <p>© {new Date().getFullYear()} MediMinds Skin Sense. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">EfficientNetB0 • Validated Sensitivity Threshold 0.35</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


