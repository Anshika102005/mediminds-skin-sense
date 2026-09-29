import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { User, Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";
import { useAuth } from "@/lib/authContext";

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelectModal: React.FC<RoleSelectModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isAuthenticated, isProfessional } = useAuth();

  const handlePatientSelect = () => {
    onClose();
    if (isAuthenticated && !isProfessional) {
      navigate("/patient/skin-check");
    } else {
      navigate("/login?role=patient&redirect=/patient/skin-check");
    }
  };

  const handleProfessionalSelect = () => {
    onClose();
    if (isAuthenticated && isProfessional) {
      navigate("/professional/dashboard");
    } else {
      navigate("/login?role=professional&redirect=/professional/dashboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-[#DCE7E5]">
        <DialogHeader className="text-center pb-4 border-b border-[#DCE7E5]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#17324D] tracking-tight">
            {language === "hi" ? "आपकी भूमिका क्या है?" : "Who Are You?"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#7B8B98] mt-1 max-w-sm mx-auto">
            {language === "hi"
              ? "आगे बढ़ने के लिए अपनी उपयुक्त भूमिका का चयन करें।"
              : "Choose how you want to continue with MediMinds Skin Sense."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Patient Card */}
          <div
            onClick={handlePatientSelect}
            className="group cursor-pointer rounded-2xl border border-[#DCE7E5] p-5 bg-white hover:border-[#0F766E] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center mb-4 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#17324D] mb-1">
                {t("rolePatientTitle")}
              </h3>
              <p className="text-xs text-[#5F7182] leading-relaxed">
                {t("rolePatientDesc")}
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-[#17324D] group-hover:translate-x-1 transition-transform">
              <span>{t("rolePatientBtn")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Healthcare Professional Card */}
          <div
            onClick={handleProfessionalSelect}
            className="group cursor-pointer rounded-2xl border border-[#DCE7E5] p-5 bg-white hover:border-teal-700 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center mb-4 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#17324D] mb-1">
                {t("roleProfTitle")}
              </h3>
              <p className="text-xs text-[#5F7182] leading-relaxed">
                {t("roleProfDesc")}
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-bold text-[#0F766E] group-hover:translate-x-1 transition-transform">
              <span>{t("roleProfBtn")}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#DCE7E5] flex items-center justify-center text-[11px] text-[#7B8B98] text-center leading-relaxed">
          <span>{t("disclaimerBanner")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectModal;
