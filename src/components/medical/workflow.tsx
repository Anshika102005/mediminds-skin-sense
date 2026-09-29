import { Upload, ScanSearch, FileText, Stethoscope } from "lucide-react";
import { useLanguage } from "@/lib/languageContext";

export const WORKFLOW_STEPS = [
  { icon: Upload, num: "01" },
  { icon: ScanSearch, num: "02" },
  { icon: FileText, num: "03" },
  { icon: Stethoscope, num: "04" },
] as const;

export function useWorkflowCopy() {
  const { language } = useLanguage();
  const hi = language === "hi";
  return [
    {
      title: hi ? "त्वचा की तस्वीर अपलोड करें" : "Upload Skin Image",
      desc: hi
        ? "साफ, फोकस वाली तस्वीर लें या अपलोड करें। गुणवत्ता जांच अपने आप होती है।"
        : "Capture or upload a clear, focused photo. Automatic quality checks guide you.",
    },
    {
      title: hi ? "एआई-सहायित विश्लेषण" : "AI-Assisted Analysis",
      desc: hi
        ? "प्रशिक्षित मॉडल त्वचा पैटर्न की समानता का आकलन करता है — निदान नहीं करता।"
        : "The trained model assesses visual pattern similarity — never a diagnosis.",
    },
    {
      title: hi ? "स्क्रीनिंग परिणाम देखें" : "Review Screening Result",
      desc: hi
        ? "सरल रिपोर्ट में पैटर्न, कॉन्फिडेंस और समीक्षा सुझाव देखें।"
        : "See pattern, confidence and review guidance in a plain clinical report.",
    },
    {
      title: hi ? "स्वास्थ्य पेशेवर से परामर्श करें" : "Consult a Healthcare Professional",
      desc: hi
        ? "रिपोर्ट सहेजें और त्वचा विशेषज्ञ से व्यक्तिगत मूल्यांकन कराएं।"
        : "Save the report and get in-person evaluation from a dermatologist.",
    },
  ];
}

export default WORKFLOW_STEPS;
