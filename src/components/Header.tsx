import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";
import { useAuth } from "@/lib/authContext";
import { RoleSelectModal } from "./RoleSelectModal";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated, isProfessional } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const navLinkClass = (to: string) =>
    `transition-colors ${isActive(to) ? "text-[#0F766E] font-semibold" : "hover:text-[#17324D]"}`;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleLanguage = () => setLanguage(language === "en" ? "hi" : "en");

  const handleStartScreening = () => {
    if (isAuthenticated) {
      if (isProfessional) {
        navigate("/professional/dashboard");
      } else {
        navigate("/patient/skin-check");
      }
    } else {
      setIsRoleModalOpen(true);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#DCE7E5] sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="med-container h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 text-[#7FC8BC]" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-[#17324D] tracking-tight block leading-tight">
                MediMinds <span className="text-[#0F766E] font-bold">Skin Sense</span>
              </span>
              <span className="text-xs text-[#7B8B98] hidden sm:block">
                AI-Assisted Skin Screening Platform
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium text-[#5F7182]">
            <Link to="/" className={navLinkClass("/")}>{t("navHome")}</Link>
            <Link to="/patient/skin-check" className={navLinkClass("/patient/skin-check")}>{t("navScreening")}</Link>
            <Link to="/awareness" className={navLinkClass("/awareness")}>{t("navAwareness")}</Link>
            <Link to="/how-it-works" className={navLinkClass("/how-it-works")}>{t("navHowItWorks")}</Link>
            <Link to="/professionals" className={navLinkClass("/professionals")}>{t("navProfessionals")}</Link>
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="border-[#DCE7E5] text-[#5F7182] text-xs font-semibold flex items-center space-x-1.5 rounded-xl px-3 py-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#7B8B98]" />
              <span>{language === "en" ? "हिन्दी" : "English"}</span>
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(isProfessional ? "/professional/dashboard" : "/patient/dashboard")}
                  className="text-xs font-semibold text-[#17324D] rounded-xl border-[#DCE7E5]"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#0F766E] mr-1.5" />
                  <span>{user?.full_name?.split(" ")[0]}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="p-2 text-[#7B8B98] hover:text-[#B84A5A] rounded-xl"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="text-xs font-semibold text-[#5F7182] rounded-xl"
                >
                  {t("navLogin")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartScreening}
                  className="bg-[#0F766E] hover:bg-[#0C655E] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm"
                >
                  {language === "hi" ? "त्वचा स्क्रीनिंग शुरू करें" : "Start Skin Screening"}
                </Button>
              </div>
            )}
          </div>

          <div className="lg:hidden flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="text-xs px-2.5 py-1 rounded-lg border-[#DCE7E5]">
              {language === "en" ? "हिन्दी" : "EN"}
            </Button>
            <Button variant="ghost" className="text-[#17324D] p-2" onClick={toggleMenu}>
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#DCE7E5] px-4 pt-2 pb-6 space-y-3">
            <nav className="flex flex-col text-[15px] font-medium text-[#17324D]">
              <Link to="/" className={`py-2.5 border-b border-[#EEF7F5] ${isActive("/") ? "text-[#0F766E] font-semibold" : ""}`} onClick={toggleMenu}>{t("navHome")}</Link>
              <Link to="/patient/skin-check" className={`py-2.5 border-b border-[#EEF7F5] ${isActive("/patient/skin-check") ? "text-[#0F766E] font-semibold" : ""}`} onClick={toggleMenu}>{t("navScreening")}</Link>
              <Link to="/awareness" className={`py-2.5 border-b border-[#EEF7F5] ${isActive("/awareness") ? "text-[#0F766E] font-semibold" : ""}`} onClick={toggleMenu}>{t("navAwareness")}</Link>
              <Link to="/how-it-works" className={`py-2.5 border-b border-[#EEF7F5] ${isActive("/how-it-works") ? "text-[#0F766E] font-semibold" : ""}`} onClick={toggleMenu}>{t("navHowItWorks")}</Link>
              <Link to="/professionals" className={`py-2.5 ${isActive("/professionals") ? "text-[#0F766E] font-semibold" : ""}`} onClick={toggleMenu}>{t("navProfessionals")}</Link>
            </nav>
            <Button
              onClick={() => {
                toggleMenu();
                handleStartScreening();
              }}
            className="w-full med-btn-primary mt-3 text-[14px] py-3 h-auto"
            >
              {language === "hi" ? "त्वचा स्क्रीनिंग शुरू करें" : "Start Skin Screening"}
            </Button>
          </div>
        )}
      </header>

      <RoleSelectModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />
    </>
  );
};

export default Header;
