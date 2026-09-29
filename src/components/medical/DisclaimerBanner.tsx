import React from "react";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { t } = useLanguage();
  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border border-[#E4CDA3] bg-[#FBF4E6] text-[#7A5A1E] ${
        compact ? "p-3 text-[13px]" : "p-4 text-[14px]"
      } leading-relaxed`}
    >
      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#C98A2E]" />
      <p>
        <strong className="font-semibold">AI-assisted screening only. </strong>
        <span>{t("disclaimerBanner")}</span>
      </p>
    </div>
  );
};

export default DisclaimerBanner;
