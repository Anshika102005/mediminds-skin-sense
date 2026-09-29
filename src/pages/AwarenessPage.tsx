import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AbcdeGuide } from "@/components/AbcdeGuide";
import { useLanguage } from "@/lib/languageContext";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  Sun,
  Eye,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

export const AwarenessPage: React.FC = () => {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const faqs = [
    {
      qEn: "Can MediMinds Skin Sense confirm if a skin lesion is cancerous?",
      qHi: "क्या मेडिमाइंड्स स्किन सेंस पुष्टि कर सकता है कि कोई तिल या घाव कैंसर है?",
      aEn: "No. MediMinds Skin Sense is an AI-assisted screening and triage aid, not a diagnostic system. Only a certified dermatologist or pathologist through a histopathological biopsy can diagnose skin cancer.",
      aHi: "नहीं। मेडिमाइंड्स स्किन सेंस केवल एक एआई-सहायित स्क्रीनिंग और ट्राइएज उपकरण है। केवल प्रमाणित त्वचा विशेषज्ञ बायोप्सी परीक्षण के माध्यम से ही स्किन कैंसर का सही निदान कर सकते हैं।",
    },
    {
      qEn: "What do the ML model's prediction classes (mel, bcc, akiec, nv, etc.) represent?",
      qHi: "एमएल मॉडल के प्रेडिक्शन वर्ग (mel, bcc, akiec, nv, आदि) क्या दर्शाते हैं?",
      aEn: "These classes correspond to training categories from public dermatological research datasets (such as HAM10000 / ISIC). They indicate visual pattern similarity to reference dataset groups and should never be interpreted as individual clinical diagnoses.",
      aHi: "ये वर्ग सार्वजनिक डर्मेटोलॉजिकल रिसर्च डेटासेट (जैसे HAM10000 / ISIC) के प्रशिक्षण समूहों के अनुरूप हैं। ये दृश्य पैटर्न की समानता दर्शाते हैं और इन्हें कभी भी व्यक्तिगत चिकित्सीय निदान के रूप में नहीं माना जाना चाहिए।",
    },
    {
      qEn: "What is the 0.35 sensitivity referral threshold?",
      qHi: "0.35 संवेदनशीलता रेफरल थ्रेशोल्ड क्या है?",
      aEn: "In dermatological screening, missing a potentially malignant lesion carries high clinical risk. A frozen threshold of 0.35 was calibrated on validation data to maximize sensitivity (recall) for combined potentially malignant classes (melanoma, basal cell carcinoma, and actinic keratosis) so that suspicious cases are flagged for professional review.",
      aHi: "त्वचा स्क्रीनिंग में संभावित कैंसरयुक्त घाव को नजरअंदाज करना जोखिम भरा होता है। संभावित घातक श्रेणियों (मेलानोमा, बीसीसी, एके) के लिए संवेदनशीलता बढ़ाने हेतु 0.35 का थ्रेशोल्ड निर्धारित किया गया है ताकि संदेहास्पद मामलों की तुरंत डॉक्टर से समीक्षा कराई जा सके।",
    },
    {
      qEn: "How does Grad-CAM assist clinicians?",
      qHi: "Grad-CAM डॉक्टरों और नर्सों की कैसे मदद करता है?",
      aEn: "Grad-CAM visualizes gradient-weighted activations in the neural network's final convolutional layer. It highlights the image regions that contributed most strongly to the model's output, allowing clinicians to verify whether the AI focused on the lesion or on confounding artifacts (like hair, ruler markings, or lighting glare).",
      aHi: "Grad-CAM तंत्रिका नेटवर्क की अंतिम परत में सक्रियता को हीटमैप के रूप में दिखाता है। इससे चिकित्सक देख सकते हैं कि एआई ने घाव पर ध्यान दिया है या किसी बाहरी तत्व (जैसे बाल, स्केल या रोशनी की चमक) पर।",
    },
    {
      qEn: "When should I see a dermatologist immediately?",
      qHi: "मुझे त्वचा विशेषज्ञ के पास तुरंत कब जाना चाहिए?",
      aEn: "Consult a healthcare professional immediately if you notice a new or existing skin spot that is rapidly growing, changing color or border, bleeding, oozing, itching, or failing to heal over several weeks.",
      aHi: "यदि कोई नया या पुराना तिल तेजी से बढ़ रहा हो, रंग या किनारा बदल रहा हो, खून बह रहा हो, खुजली हो रही हो, या कई हफ्तों तक ठीक न हो रहा हो, तो तुरंत डॉक्टर से संपर्क करें।",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF9]">
      <Header />

      <main className="flex-1 med-container py-12 max-w-5xl">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EEF7F5] text-[#17324D] border border-[#DCE7E5] mb-3">
            <Info className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>{hi ? "जन स्वास्थ्य एवं नैदानिक जागरूकता" : "Public Health & Clinical Awareness"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17324D] tracking-tight">
            {language === "hi" ? "स्किन कैंसर जागरूकता एवं मार्गदर्शन" : "Skin Cancer Awareness & Educational Guide"}
          </h1>
          <p className="text-sm sm:text-base text-[#5F7182] mt-2 leading-relaxed">
            {language === "hi"
              ? "त्वचा के असामान्य लक्षणों, प्रारंभिक चेतावनी संकेतों और पेशेवर चिकित्सा मूल्यांकन के महत्व को समझें।"
              : "Understand skin cancer types, early detection mnemonics, risk factors, and the role of AI-assisted screening."}
          </p>
        </div>

        {/* SECTION 1: WHAT IS SKIN CANCER? */}
        <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="text-xl font-bold text-[#17324D] mb-3 flex items-center">
            <span className="w-2 h-6 bg-[#0F766E] rounded-full mr-2.5"></span>
            1. {language === "hi" ? "स्किन कैंसर क्या है?" : "What is Skin Cancer?"}
          </h2>
          <p className="text-xs sm:text-sm text-[#5F7182] leading-relaxed mb-4">
            {hi
              ? "स्किन कैंसर त्वचा की कोशिकाओं की असामान्य और अनियंत्रित वृद्धि है। यह मुख्यतः सूर्य की पराबैंगनी (UV) किरणों या टैनिंग उपकरणों के संपर्क में आने वाले हिस्सों पर होता है, पर हथेली, तलवे और नाखून के नीचे भी हो सकता है।"
              : "Skin cancer is the abnormal and uncontrolled growth of cutaneous cells. It most frequently develops on areas of skin exposed to ultraviolet (UV) radiation from sunlight or artificial tanning sources, although it can also occur on unexposed areas like the palms, soles of the feet, and under nails."}
          </p>
          <div className="bg-[#F7FAF9] border border-[#DCE7E5] rounded-xl p-4 text-xs text-[#5F7182] leading-relaxed">
            {hi ? (
              <>
                <strong>महत्वपूर्ण तथ्य:</strong> प्रारंभिक एवं स्थानीयकृत चरण में पहचाने जाने पर अधिकांश त्वचा कैंसर का इलाज संभव है और दीर्घकालिक परिणाम बेहतर होते हैं। नियमित स्व-जांच और समय पर डॉक्टर की समीक्षा सबसे प्रभावी रोकथाम है।
              </>
            ) : (
              <>
                <strong>Key Awareness Fact:</strong> Most skin cancers are highly treatable and have outstanding long-term prognoses when detected and excised at an early, localized stage. Regular skin self-examinations and timely clinician review are the cornerstones of effective secondary prevention.
              </>
            )}
          </div>
        </section>

        {/* SECTION 2: TYPES OF SKIN CANCER & DATASET NOTE */}
        <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 sm:p-8 shadow-sm mb-10 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#17324D] mb-3 flex items-center">
              <span className="w-2 h-6 bg-[#0F766E] rounded-full mr-2.5"></span>
              2. {hi ? "स्किन कैंसर के मुख्य प्रकार" : "Major Types of Skin Cancer"}
            </h2>
            <p className="text-xs sm:text-sm text-[#5F7182] leading-relaxed">
              {hi
                ? "त्वचा ऑन्कोलॉजी में स्किन कैंसर को मेलेनोमा और गैर-मेलेनोमा श्रेणियों में बाँटा जाता है।"
                : "Dermatological oncology categorizes skin cancers into melanoma and non-melanoma malignancies."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Melanoma */}
            <div className="p-5 rounded-2xl border border-[#E8BCC3] bg-[#F9ECEE]/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A2E3A] bg-[#F9ECEE] px-2 py-0.5 rounded-full">
                {hi ? "सबसे गंभीर" : "Most Serious"}
              </span>
              <h3 className="font-bold text-base text-[#17324D]">Melanoma (mel)</h3>
              <p className="text-xs text-[#5F7182] leading-relaxed">
                {hi
                  ? "रंग बनाने वाली मेलेनोसाइट कोशिकाओं से शुरू होता है। मामलों की संख्या कम होने पर भी तेजी से फैलने की क्षमता के कारण यह अधिकांश त्वचा कैंसर मृत्यु का कारण बनता है।"
                  : "Originates in pigment-producing melanocytes. While accounting for a minority of skin cancer cases, melanoma causes the vast majority of skin cancer deaths due to its capacity for rapid lymphatic and hematogenous metastasis."}
              </p>
            </div>

            {/* Basal Cell Carcinoma */}
            <div className="p-5 rounded-2xl border border-[#E4CDA3] bg-[#FBF4E6]/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5A1E] bg-[#FBF4E6] px-2 py-0.5 rounded-full">
                {hi ? "सबसे सामान्य" : "Most Common"}
              </span>
              <h3 className="font-bold text-base text-[#17324D]">Basal Cell Carcinoma (bcc)</h3>
              <p className="text-xs text-[#5F7182] leading-relaxed">
                {hi
                  ? "एपिडर्मिस की गहरी परत की बेसल कोशिकाओं में विकसित होता है। मोती जैसे या पारदर्शी दानों के रूप में दिखता है। मेटास्टेसिस दुर्लभ है, पर उपचार न होने पर स्थानीय ऊतक को नुकसान पहुँचा सकता है।"
                  : "Develops in basal cells of the deepest epidermal layer. Characterized by pearly or translucent papules with telangiectasias. Very rarely metastasizes but can cause significant local tissue destruction if left untreated."}
              </p>
            </div>

            {/* Squamous Cell Carcinoma */}
            <div className="p-5 rounded-2xl border border-[#DCE7E5] bg-[#EEF7F5]/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] bg-[#EEF7F5] px-2 py-0.5 rounded-full">
                {hi ? "दूसरा सबसे सामान्य" : "Second Most Common"}
              </span>
              <h3 className="font-bold text-base text-[#17324D]">Squamous Cell Carcinoma (akiec)</h3>
              <p className="text-xs text-[#5F7182] leading-relaxed">
                {hi
                  ? "एपिडर्मिस की स्क्वैमस कोशिकाओं में बनता है, अक्सर एक्टिनिक केराटोसिस (पूर्व-कैंसरस घाव) से पहले। कठोर लाल गाँठ या पपड़ीदार घाव के रूप में दिखता है; अनदेखा करने पर मध्यम जोखिम रहता है।"
                  : "Arises in squamous epidermal cells, often preceded by actinic keratosis (pre-cancerous intraepithelial lesions). Presents as firm red nodules or scaly crusted sores. Has an intermediate risk of metastasis if neglected."}
              </p>
            </div>
          </div>

          {/* Critical Note on Dataset Classes vs Medical Diagnosis */}
          <div className="p-4 rounded-xl bg-[#FBF4E6] border border-[#E4CDA3] text-xs text-[#7A5A1E] leading-relaxed">
            <strong className="block mb-1 font-semibold">
              {hi ? "मशीन लर्निंग वर्ग लेबल पर आवश्यक नोट:" : "Crucial Note on Machine Learning Class Labels:"}
            </strong>
            {hi ? (
              <>
                इस प्लेटफ़ॉर्म में प्रयुक्त वर्ग संक्षेप (<code>mel</code>, <code>bcc</code>, <code>akiec</code>, <code>nv</code>, <code>bkl</code>, <code>df</code>, <code>vasc</code>) डर्मेटोलॉजिकल अनुसंधान डेटासेट (HAM10000/ISIC) के सांख्यिकीय लेबल हैं। <strong>इन्हें कभी भी सीधा चिकित्सीय निदान न मानें।</strong> <code>mel</code> आउटपुट का अर्थ केवल डेटासेट छवियों से दृश्य समानता है, जो पेशेवर जांच के लिए संकेत मात्र है।
              </>
            ) : (
              <>
                The class abbreviations used in this platform (<code>mel</code>, <code>bcc</code>, <code>akiec</code>, <code>nv</code>, <code>bkl</code>, <code>df</code>, <code>vasc</code>) are statistical taxonomy labels from dermatological research datasets (HAM10000/ISIC). <strong>They must never be presented or interpreted as direct medical diagnoses.</strong> A model output of <code>mel</code> means visual pattern similarity to dataset reference images, which serves exclusively as a triage prompt for professional clinical examination.
              </>
            )}
          </div>
        </section>

        {/* SECTION 3: WARNING SIGNS */}
        <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="text-xl font-bold text-[#17324D] mb-3 flex items-center">
            <span className="w-2 h-6 bg-[#0F766E] rounded-full mr-2.5"></span>
            3. {hi ? "चेतावनी के संकेत ('Ugly Duckling' नियम)" : "Warning Signs & The 'Ugly Duckling' Sign"}
          </h2>
          <p className="text-xs sm:text-sm text-[#5F7182] leading-relaxed mb-4">
            {hi ? (
              <>
                अधिकांश सौम्य तिल रंग और पैटर्न में एक जैसे दिखते हैं। चिकित्सक <strong>"Ugly Duckling" नियम</strong> सिखाते हैं: जो घाव आकार, गहराई या आकृति में अन्य तिलों से स्पष्ट भिन्न दिखे, उसकी नैदानिक जाँच को प्राथमिकता दी जानी चाहिए।
              </>
            ) : (
              <>
                Most benign moles on an individual resemble one another in color and pattern. Clinicians teach the <strong>"Ugly Duckling" sign</strong>: a lesion that stands out as distinctly different from the patient's other moles in size, darkness, or shape warrants prioritized clinical inspection.
              </>
            )}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5F7182]">
            <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#DCE7E5] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#C98A2E] mt-0.5 flex-shrink-0" />
              <span>{hi ? "ऐसा घाव जो 4 सप्ताह में न भरे।" : "A sore that does not heal within 4 weeks."}</span>
            </div>
            <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#DCE7E5] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#C98A2E] mt-0.5 flex-shrink-0" />
              <span>{hi ? "बार-बार रिसने, खून आने, पपड़ी या परत जमने वाला धब्बा।" : "A spot that oozes, bleeds, scales, or crusts repeatedly."}</span>
            </div>
            <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#DCE7E5] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#C98A2E] mt-0.5 flex-shrink-0" />
              <span>{hi ? "नई खुजली, संवेदनशीलता, दर्द या सूजन।" : "New itchiness, tenderness, pain, or inflammation."}</span>
            </div>
            <div className="p-3 bg-[#F7FAF9] rounded-xl border border-[#DCE7E5] flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#C98A2E] mt-0.5 flex-shrink-0" />
              <span>{hi ? "धब्बे से आसपास की त्वचा में रंग का फैलाव।" : "Spread of pigment from a spot into surrounding skin."}</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: INTERACTIVE ABCDE RULE */}
        <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="text-xl font-bold text-[#17324D] mb-2 flex items-center">
            <span className="w-2 h-6 bg-[#0F766E] rounded-full mr-2.5"></span>
            4. {hi ? "ABCDE नियम" : "The ABCDE Rule"}
          </h2>
          <AbcdeGuide />
          <div className="mt-4 p-3 bg-[#F7FAF9] rounded-xl text-center text-xs text-[#7B8B98] border border-[#DCE7E5]">
            {hi
              ? "ABCDE मार्गदर्शिका केवल शैक्षिक जागरूकता के लिए है और स्किन कैंसर का निदान नहीं करती।"
              : "The ABCDE guide is for educational awareness and does not diagnose skin cancer."}
          </div>
        </section>

        {/* SECTION 5 & 6: RISK FACTORS & PREVENTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-[#17324D] flex items-center">
              <span className="w-2 h-5 bg-[#0F766E] rounded-full mr-2"></span>
              5. {hi ? "जोखिम कारक" : "Key Risk Factors"}
            </h2>
            <ul className="space-y-2 text-xs text-[#5F7182]">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>UV संपर्क:</strong> जीवनभर की धूप और गंभीर छालेदार सनबर्न।</> : <><strong>UV Exposure:</strong> Cumulative lifetime sunlight and severe blistering sunburns.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>त्वचा का प्रकार:</strong> गोरी त्वचा, हल्की आँखें, सुनहरे/लाल बाल या झाइयाँ।</> : <><strong>Skin Phototype:</strong> Fair skin, light eyes, blonde/red hair, or freckles.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>तिलों की संख्या:</strong> 50 से अधिक सामान्य तिल या असामान्य (डिस्प्लास्टिक) नेवी।</> : <><strong>Mole Count:</strong> Having more than 50 common moles or atypical (dysplastic) nevi.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>पारिवारिक इतिहास:</strong> प्रथम श्रेणी के संबंधी में मेलेनोमा का निदान।</> : <><strong>Family History:</strong> First-degree relative diagnosed with melanoma.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>प्रतिरक्षा-दमन:</strong> अंग प्रत्यारोपण या दीर्घकालिक कमजोर प्रतिरक्षा तंत्र।</> : <><strong>Immunosuppression:</strong> Organ transplant recipients or chronic immune compromise.</>}</span>
              </li>
            </ul>
          </section>

          <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-[#17324D] flex items-center">
              <span className="w-2 h-5 bg-[#2A9D8F] rounded-full mr-2"></span>
              6. {hi ? "रोकथाम दिशानिर्देश" : "Prevention Guidelines"}
            </h2>
            <ul className="space-y-2 text-xs text-[#5F7182]">
              <li className="flex items-start space-x-2">
                <Sun className="w-3.5 h-3.5 text-[#C98A2E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>ब्रॉड-स्पेक्ट्रम सनस्क्रीन:</strong> बाहर निकलने पर हर 2 घंटे में SPF 30+ लगाएँ।</> : <><strong>Broad-Spectrum Sunscreen:</strong> Apply SPF 30+ generously every 2 hours outdoors.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <Sun className="w-3.5 h-3.5 text-[#C98A2E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>तेज धूप से बचाव:</strong> सुबह 10 से शाम 4 बजे तक छाया में रहें।</> : <><strong>Peak Sun Avoidance:</strong> Seek shade between 10:00 AM and 4:00 PM.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <Sun className="w-3.5 h-3.5 text-[#C98A2E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>सुरक्षात्मक कपड़े:</strong> चौड़ी-किनारी टोपी, UV-रोधी चश्मा और पूरी आस्तीन के कपड़े पहनें।</> : <><strong>Protective Clothing:</strong> Wide-brimmed hats, UV-blocking sunglasses, and long sleeves.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <Sun className="w-3.5 h-3.5 text-[#C98A2E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>टैनिंग बेड से बचें:</strong> टैनिंग उपकरण तीव्र कैंसरकारी UVA विकिरण निकालते हैं।</> : <><strong>Avoid Tanning Beds:</strong> Tanning devices emit intensive carcinogenic UVA radiation.</>}</span>
              </li>
              <li className="flex items-start space-x-2">
                <Sun className="w-3.5 h-3.5 text-[#C98A2E] mt-0.5 flex-shrink-0" />
                <span>{hi ? <><strong>मासिक स्व-जांच:</strong> महीने में एक बार आईने की मदद से पूरे शरीर की जाँच करें।</> : <><strong>Monthly Self-Checks:</strong> Inspect your skin head-to-toe with mirrors once a month.</>}</span>
              </li>
            </ul>
          </section>
        </div>

        {/* SECTION 7: WHEN TO SEE A CLINICIAN */}
        <section className="bg-[#0F766E] text-white rounded-2xl p-6 sm:p-8 mb-10">
          <div className="flex items-start space-x-3">
            <Stethoscope className="w-6 h-6 text-[#7FC8BC] mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold mb-2">
                7. {hi ? "डॉक्टर से कब मिलें?" : "When to See a Healthcare Professional"}
              </h2>
              <p className="text-xs sm:text-sm text-[#DCE7E5] leading-relaxed mb-4">
                {hi ? (
                  <>
                    यदि कोई धब्बा बदल रहा हो, अचानक रंग बदले, बिना चोट खून आए, या मेडिमाइंड्स स्किन सेंस आपकी स्क्रीनिंग को <strong>पेशेवर समीक्षा योग्य</strong> बताए, तो योग्य चिकित्सक या त्वचा विशेषज्ञ से मूल्यांकन कराएँ।
                  </>
                ) : (
                  <>
                    If you observe any evolving spot, sudden pigmentation change, bleeding without trauma, or if MediMinds Skin Sense assigns a <strong>Requires Professional Review</strong> rating to your screening, schedule an evaluation with a licensed physician or dermatologist.
                  </>
                )}
              </p>
              <div className="p-3 bg-[#17324D] rounded-xl text-xs text-[#B9C8D4] border border-white/20 leading-relaxed">
                {hi
                  ? "किसी स्वचालित स्क्रीनिंग परिणाम के भरोसे पर व्यक्तिगत जाँच में देरी न करें। चिकित्सक की दृश्य जाँच और डर्मोस्कोपी ही स्वर्ण मानक हैं।"
                  : "Never delay in-person assessment based on reassurance from an automated screening tool. Clinician visual examination and dermoscopy remain the gold standard."}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <section className="bg-white border border-[#DCE7E5] rounded-2xl p-6 sm:p-8 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-[#17324D] mb-6 flex items-center">
            <HelpCircle className="w-5 h-5 text-[#0F766E] mr-2" />
            8. {language === "hi" ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}
          </h2>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="border border-[#DCE7E5] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-4 bg-[#F7FAF9] hover:bg-[#F7FAF9] flex justify-between items-center text-xs sm:text-sm font-semibold text-[#17324D]"
                >
                  <span>{language === "hi" ? f.qHi : f.qEn}</span>
                  <span className="text-[#7B8B98] ml-2 text-base">
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 bg-white text-xs sm:text-sm text-[#5F7182] border-t border-[#DCE7E5] leading-relaxed">
                    {language === "hi" ? f.aHi : f.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA to Screening */}
        <div className="text-center p-8 bg-[#EEF7F5] rounded-2xl border border-[#DCE7E5] max-w-xl mx-auto">
          <h3 className="font-bold text-base text-[#17324D] mb-1">
            {language === "hi" ? "संदेहास्पद त्वचा तिल की जांच करें" : "Screen a Suspicious Skin Lesion"}
          </h3>
          <p className="text-xs text-[#7B8B98] mb-4">
            {hi
              ? "छवि अपलोड करें — गुणवत्ता जाँच और व्याख्यायोग्य एआई मूल्यांकन प्राप्त करें।"
              : "Upload an image for pre-screening quality checks and explainable AI assessment."}
          </p>
          <Button asChild className="bg-[#0F766E] hover:bg-[#0C655E] text-white text-xs font-semibold px-6 py-2.5 rounded-xl">
            <Link to="/patient/skin-check">
              <span>{language === "hi" ? "स्क्रीनिंग शुरू करें" : "Start Skin Screening"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AwarenessPage;
