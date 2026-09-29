import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldAlert } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  narrow?: boolean;
}

export const MedicalPage: React.FC<Props> = ({ eyebrow, title, subtitle, children, narrow }) => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />
      <main className="flex-1">
        <section className="bg-white border-b border-[#DCE7E5]">
          <div className={`med-container py-10 sm:py-12 ${narrow ? "max-w-4xl" : ""}`}>
            {eyebrow && (
              <span className="inline-flex items-center text-[12px] font-semibold uppercase tracking-wider text-[#0F766E] bg-[#EEF7F5] border border-[#DCE7E5] px-3 py-1 rounded-full">
                {eyebrow}
              </span>
            )}
            <h1 className="text-[32px] sm:text-[40px] font-bold text-[#17324D] tracking-tight mt-3 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[16px] sm:text-[17px] text-[#5F7182] mt-2 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
            <div className="mt-4 flex items-start gap-2 text-[13px] sm:text-[14px] text-[#5F7182] bg-[#EEF7F5] border border-[#DCE7E5] rounded-xl px-4 py-3 max-w-3xl">
              <ShieldAlert className="w-4 h-4 text-[#0F766E] mt-0.5 flex-shrink-0" />
              <span>{t("disclaimerBanner")}</span>
            </div>
          </div>
        </section>
        <div className={`med-container py-10 ${narrow ? "max-w-4xl" : ""}`}>{children}</div>
      </main>
      <Footer />
    </div>
  );
};

export default MedicalPage;
