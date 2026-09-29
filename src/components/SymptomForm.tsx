
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/languageContext";
import { ClipboardList } from "lucide-react";

interface SymptomFormProps {
  onSymptomSubmit: (symptoms: string[], description: string) => void;
}

const SymptomForm = ({ onSymptomSubmit }: SymptomFormProps) => {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const commonSymptoms = [
    { id: "changing-mole", label: hi ? "तिल या धब्बे में बदलाव" : "Changing mole or spot" },
    { id: "irregular-borders", label: hi ? "अनियमित किनारे" : "Irregular borders" },
    { id: "multiple-colors", label: hi ? "तिल में अनेक रंग" : "Multiple colors in a mole" },
    { id: "large-diameter", label: hi ? "बड़ा व्यास (6 मिमी से अधिक)" : "Large diameter (> 6mm)" },
    { id: "itching", label: hi ? "खुजली या असहजता" : "Itching or discomfort" },
    { id: "bleeding", label: hi ? "खून आना या रिसाव" : "Bleeding or oozing" },
    { id: "redness", label: hi ? "लालिमा या सूजन" : "Redness or swelling" },
    { id: "scaling", label: hi ? "पपड़ी या खुरदरी सतह" : "Scaling or crusty surface" },
  ];

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    if (checked) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    } else {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSymptomSubmit(selectedSymptoms, description);
  };

  return (
    <Card className="med-card p-6 bg-white">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start gap-3 border-b border-[#DCE7E5] pb-4">
          <span className="w-10 h-10 rounded-xl bg-[#EEF7F5] text-[#0F766E] border border-[#DCE7E5] flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-[#17324D]">
              {hi ? "लक्षण और अवलोकन" : "Reported Symptoms"}
            </h3>
            <p className="text-[13px] text-[#5F7182] leading-relaxed">
              {hi
                ? "वैकल्पिक — ये अवलोकन रिपोर्ट में नोट किए जाते हैं और पेशेवर की समीक्षा में सहायक होते हैं।"
                : "Optional — these observations are recorded in the report and help professional review."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commonSymptoms.map((symptom) => (
            <div
              key={symptom.id}
              className="flex items-center space-x-2.5 rounded-xl border border-[#DCE7E5] bg-[#F7FAF9] px-3.5 py-2.5"
            >
              <Checkbox
                id={symptom.id}
                checked={selectedSymptoms.includes(symptom.label)}
                onCheckedChange={(checked) =>
                  handleSymptomChange(symptom.label, checked === true)
                }
                className="border-[#7B8B98] data-[state=checked]:bg-[#0F766E] data-[state=checked]:border-[#0F766E]"
              />
              <Label htmlFor={symptom.id} className="cursor-pointer text-[13px] text-[#17324D]">
                {symptom.label}
              </Label>
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="description" className="text-[13px] font-semibold text-[#17324D]">
            {hi ? "अन्य विवरण" : "Additional description"}
          </Label>
          <Textarea
            id="description"
            placeholder={
              hi
                ? "अन्य कोई लक्षण या चिंता यहाँ लिखें..."
                : "Please describe any other symptoms or concerns you have noticed..."
            }
            className="mt-2 resize-none med-input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button type="submit" className="med-btn-primary w-full h-auto py-3 text-[15px]">
          {hi ? "लक्षण सहेजें" : "Save Symptoms"}
        </Button>
      </form>
    </Card>
  );
};

export default SymptomForm;
