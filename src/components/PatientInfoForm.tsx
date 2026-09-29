
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/lib/languageContext";
import { ArrowRight, UserRound } from "lucide-react";

interface PatientInfo {
  name: string;
  age: string;
  gender: string;
}

interface PatientInfoFormProps {
  onPatientInfoSubmit: (patientInfo: PatientInfo) => void;
  initialValues?: PatientInfo;
}

const PatientInfoForm = ({ onPatientInfoSubmit, initialValues }: PatientInfoFormProps) => {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [patientInfo, setPatientInfo] = useState<PatientInfo>(
    initialValues || {
      name: "",
      age: "",
      gender: ""
    }
  );

  const handleChange = (field: keyof PatientInfo, value: string) => {
    setPatientInfo((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPatientInfoSubmit(patientInfo);
  };

  return (
    <Card className="med-card p-6 bg-white">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 border-b border-[#DCE7E5] pb-4">
          <span className="w-10 h-10 rounded-xl bg-[#EEF7F5] text-[#0F766E] border border-[#DCE7E5] flex items-center justify-center flex-shrink-0">
            <UserRound className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-[#17324D]">
              {hi ? "मरीज़ की जानकारी" : "Patient Information"}
            </h3>
            <p className="text-[13px] text-[#5F7182] leading-relaxed">
              {hi
                ? "यह जानकारी केवल स्क्रीनिंग रिकॉर्ड को लेबल करने के लिए उपयोग होती है।"
                : "This information is used only to label the screening record."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="patient-name" className="text-[13px] font-semibold text-[#17324D]">
              {hi ? "पूरा नाम" : "Full Name"}
            </Label>
            <Input
              id="patient-name"
              className="med-input mt-1.5"
              placeholder={hi ? "मरीज़ का पूरा नाम दर्ज करें" : "Enter patient's full name"}
              value={patientInfo.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="patient-age" className="text-[13px] font-semibold text-[#17324D]">
              {hi ? "आयु" : "Age"}
            </Label>
            <Input
              id="patient-age"
              className="med-input mt-1.5"
              type="number"
              placeholder={hi ? "आयु दर्ज करें" : "Enter patient's age"}
              min="0"
              max="120"
              value={patientInfo.age}
              onChange={(e) => handleChange("age", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="patient-gender" className="text-[13px] font-semibold text-[#17324D]">
              {hi ? "लिंग" : "Gender"}
            </Label>
            <Select
              value={patientInfo.gender}
              onValueChange={(value) => handleChange("gender", value)}
              required
            >
              <SelectTrigger id="patient-gender" className="med-input mt-1.5 h-11">
                <SelectValue placeholder={hi ? "लिंग चुनें" : "Select gender"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{hi ? "पुरुष" : "Male"}</SelectItem>
                <SelectItem value="female">{hi ? "महिला" : "Female"}</SelectItem>
                <SelectItem value="other">{hi ? "अन्य" : "Other"}</SelectItem>
                <SelectItem value="prefer-not-to-say">
                  {hi ? "बताना नहीं चाहते" : "Prefer not to say"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="med-btn-primary w-full h-auto py-3 text-[15px]">
          <span>{hi ? "तस्वीर अपलोड पर आगे बढ़ें" : "Continue to Image Upload"}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </Card>
  );
};

export default PatientInfoForm;
