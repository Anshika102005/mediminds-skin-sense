
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Patient Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patient-name">Full Name</Label>
              <Input 
                id="patient-name" 
                placeholder="Enter patient's full name"
                value={patientInfo.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="patient-age">Age</Label>
              <Input 
                id="patient-age" 
                type="number" 
                placeholder="Enter patient's age"
                min="0"
                max="120"
                value={patientInfo.age}
                onChange={(e) => handleChange("age", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="patient-gender">Gender</Label>
              <Select 
                value={patientInfo.gender} 
                onValueChange={(value) => handleChange("gender", value)}
                required
              >
                <SelectTrigger id="patient-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-mediminds-blue hover:bg-mediminds-darkblue"
        >
          Continue to Image Upload
        </Button>
      </form>
    </Card>
  );
};

export default PatientInfoForm;
