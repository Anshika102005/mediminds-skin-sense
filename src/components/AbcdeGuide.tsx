import React from "react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/languageContext";

export const AbcdeGuide: React.FC = () => {
  const { language } = useLanguage();

  const rules = [
    {
      letter: "A",
      nameEn: "Asymmetry",
      nameHi: "विषमता (Asymmetry)",
      descEn: "One half of the mole or spot does not match the other half in shape.",
      descHi: "तिल या धब्बे का एक आधा हिस्सा दूसरे आधे हिस्से से आकार में मेल नहीं खाता।",
      tipEn: "Benign moles are usually symmetrical and round/oval.",
      tipHi: "सामान्य तिल आमतौर पर सममित और गोल/अंडाकार होते हैं।",
    },
    {
      letter: "B",
      nameEn: "Border",
      nameHi: "किनारा (Border)",
      descEn: "The edges are irregular, ragged, notched, or blurred.",
      descHi: "किनारे अनियमित, कटे-फटे, खुरदरे या धुंधले दिखाई देते हैं।",
      tipEn: "Smooth, well-defined borders are typical of benign nevi.",
      tipHi: "चिकने और स्पष्ट किनारे सामान्य तिलों की पहचान होते हैं।",
    },
    {
      letter: "C",
      nameEn: "Color",
      nameHi: "रंग (Color)",
      descEn: "The color is not uniform; shades of tan, brown, black, red, white, or blue appear.",
      descHi: "रंग एक समान नहीं होता; काला, भूरा, लाल, सफेद या नीला मिश्रण दिखता है।",
      tipEn: "Common moles typically present as a uniform single shade of brown or tan.",
      tipHi: "सामान्य तिल आमतौर पर एक ही भूरे रंग के होते हैं।",
    },
    {
      letter: "D",
      nameEn: "Diameter",
      nameHi: "व्यास (Diameter)",
      descEn: "The spot is larger than 6 millimeters across (about the size of a pencil eraser).",
      descHi: "धब्बा 6 मिलीमीटर (पेंसिल के पिछले रबर जितना) से बड़ा होता है।",
      tipEn: "Some melanomas can be smaller, but larger lesions require close attention.",
      tipHi: "कुछ मेलेनोमा छोटे भी हो सकते हैं, पर बड़े घाव पर विशेष ध्यान दें।",
    },
    {
      letter: "E",
      nameEn: "Evolving",
      nameHi: "बदलाव (Evolving)",
      descEn: "The mole is changing in size, shape, color, or symptoms (itching, bleeding, crusting).",
      descHi: "तिल के आकार, रंग, उभार में बदलाव या खुजली/खून आना।",
      tipEn: "Any rapid lesion evolution warrants immediate in-person clinician examination.",
      tipHi: "किसी भी तेज बदलाव पर तुरंत डॉक्टर से जांच कराएँ।",
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#EEF7F5] px-3 py-1 rounded-full border border-[#DCE7E5]">
          {language === "hi" ? "नैदानिक जागरूकता नियम" : "Clinical Awareness Mnemonic"}
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold text-[#17324D] mt-3">
          {language === "hi" ? "ABCDE त्वचा जांच नियम" : "The ABCDE Rule for Skin Lesions"}
        </h3>
        <p className="text-sm text-[#5F7182] mt-2">
          {language === "hi"
            ? "शैक्षिक जागरूकता हेतु मानक नियम — यह स्वयं में कोई मेडिकल निदान नहीं है।"
            : "A standardized mnemonic used by dermatologists to guide suspicious lesion awareness."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {rules.map((r) => (
          <Card
            key={r.letter}
            className="med-card p-5 bg-white flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xl mb-3 shadow-sm">
                {r.letter}
              </div>
              <h4 className="font-bold text-base text-[#17324D] mb-1">
                {language === "hi" ? r.nameHi : r.nameEn}
              </h4>
              <p className="text-[13px] text-[#5F7182] leading-relaxed mt-2">
                {language === "hi" ? r.descHi : r.descEn}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#DCE7E5] text-[12px] text-[#7B8B98] italic">
              {language === "hi" ? r.tipHi : r.tipEn}
            </div>
          </Card>
        ))}
      </div>
      <p className="text-center text-[13px] text-[#7B8B98] mt-4">
        {language === "hi"
          ? "यह केवल शैक्षिक जागरूकता है — चिकित्सीय निदान नहीं। किसी भी बदलाव के लिए योग्य त्वचा विशेषज्ञ से परामर्श करें।"
          : "Educational awareness only — not a clinical diagnosis. Consult a qualified dermatologist for changes."}
      </p>
    </div>
  );
};
