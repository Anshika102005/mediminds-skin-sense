import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/languageContext";

interface LegalPageProps {
  kind: "privacy" | "terms";
}

const LegalPage = ({ kind }: LegalPageProps) => {
  const { t } = useLanguage();
  const isPrivacy = kind === "privacy";

  const title = isPrivacy ? t("legalPrivacyTitle") : t("legalTermsTitle");
  const paragraphs = isPrivacy
    ? [t("privacyP1"), t("privacyP2"), t("privacyP3")]
    : [t("termsP1"), t("termsP2"), t("termsP3")];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />
      <main className="flex-1 med-container py-12">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0F766E] bg-[#EEF7F5] border border-[#DCE7E5] px-2.5 py-0.5 rounded-full">
            {t("brandName")}
          </span>
          <h1 className="text-3xl font-extrabold text-[#17324D] mt-3 mb-1">
            {title}
          </h1>
          <p className="text-xs text-[#7B8B98] mb-8">{t("legalUpdated")}</p>

          <div className="bg-white border border-[#DCE7E5] rounded-xl shadow-sm p-6 sm:p-8 space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-[#5F7182] leading-relaxed">
                {p}
              </p>
            ))}
            <div className="border-t border-[#DCE7E5] pt-4">
              <p className="text-xs text-[#7B8B98]">{t("disclaimerBanner")}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
