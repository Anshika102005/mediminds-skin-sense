import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/languageContext";
import { ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const hi = language === "hi";

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />
      <main className="flex-1 med-container py-20 flex items-center justify-center">
        <div className="text-center max-w-md w-full med-card bg-white p-10">
          <div className="w-14 h-14 rounded-2xl bg-[#EEF7F5] text-[#0F766E] flex items-center justify-center mx-auto mb-5">
            <SearchX className="w-6 h-6" />
          </div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#0F766E]">
            {hi ? "त्रुटि 404" : "Error 404"}
          </p>
          <h1 className="text-[28px] font-bold text-[#17324D] mt-2">
            {hi ? "यह पृष्ठ नहीं मिला" : "Page not found"}
          </h1>
          <p className="text-[15px] text-[#5F7182] leading-relaxed mt-2 mb-7">
            {hi
              ? "आप जिस पृष्ठ की तलाश कर रहे हैं वह उपलब्ध नहीं है या उसका पता बदल गया है।"
              : "The page you are looking for is unavailable or has been moved."}
          </p>
          <Button asChild className="med-btn-primary w-full h-auto py-3 text-[15px]">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {hi ? "होम पेज पर लौटें" : "Return to Home"}
            </Link>
          </Button>
          <p className="text-[12px] text-[#7B8B98] mt-4 break-all">{location.pathname}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
