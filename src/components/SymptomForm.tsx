
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface SymptomFormProps {
  onSymptomSubmit: (symptoms: string[], description: string) => void;
}

const SymptomForm = ({ onSymptomSubmit }: SymptomFormProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const commonSymptoms = [
    { id: "changing-mole", label: "Changing mole or spot" },
    { id: "irregular-borders", label: "Irregular borders" },
    { id: "multiple-colors", label: "Multiple colors in a mole" },
    { id: "large-diameter", label: "Large diameter (> 6mm)" },
    { id: "itching", label: "Itching or discomfort" },
    { id: "bleeding", label: "Bleeding or oozing" },
    { id: "redness", label: "Redness or swelling" },
    { id: "scaling", label: "Scaling or crusty surface" },
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
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Select Symptoms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commonSymptoms.map((symptom) => (
              <div key={symptom.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={symptom.id} 
                  checked={selectedSymptoms.includes(symptom.label)}
                  onCheckedChange={(checked) => 
                    handleSymptomChange(symptom.label, checked === true)
                  }
                />
                <Label htmlFor={symptom.id} className="cursor-pointer">
                  {symptom.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-lg font-medium">
            Describe Your Symptoms
          </Label>
          <Textarea
            id="description"
            placeholder="Please describe any other symptoms or concerns you have noticed..."
            className="mt-2 resize-none"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-mediminds-blue hover:bg-mediminds-darkblue"
        >
          Analyze Symptoms
        </Button>
      </form>
    </Card>
  );
};

export default SymptomForm;
