
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadImage from "@/components/UploadImage";
import SymptomForm from "@/components/SymptomForm";
import type { PredictionResult } from "@/components/ResultCard";

const DiagnosisPage = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [symptoms, setSymptoms] = useState<{ selected: string[], description: string }>({
    selected: [],
    description: ""
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageSelected = (file: File) => {
    setSelectedImage(file);
    toast.success("Image uploaded successfully!");
  };

  const handleSymptomSubmit = (selectedSymptoms: string[], description: string) => {
    setSymptoms({
      selected: selectedSymptoms,
      description
    });
    toast.success("Symptoms recorded!");
  };

  const handleStartAnalysis = () => {
    if (!selectedImage) {
      toast.error("Please upload an image to continue.");
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis (in a real app, this would call an API)
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // Generate mock result
      const mockResult: PredictionResult = {
        prediction: Math.random() > 0.7 ? "Malignant" : Math.random() > 0.5 ? "Benign" : "Normal",
        confidence: Math.floor(Math.random() * 15) + 80, // Random between 80-95
        risk: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low"
      };
      
      // Store result in session storage for results page
      sessionStorage.setItem("diagnosis-result", JSON.stringify(mockResult));
      
      // Navigate to results page
      navigate("/results");
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Skin Analysis</h1>
        
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              <TabsTrigger value="symptoms">Describe Symptoms</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-0">
              <UploadImage onImageSelected={handleImageSelected} />
              
              <div className="text-center mt-8">
                <p className="text-sm text-gray-500 mb-2">
                  Please upload a clear, well-lit image of the affected area
                </p>
                <Button 
                  onClick={() => document.querySelector('[data-value="symptoms"]')?.click()}
                  className="bg-mediminds-blue hover:bg-mediminds-darkblue"
                >
                  Continue to Symptoms
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="symptoms" className="mt-0">
              <SymptomForm 
                onSymptomSubmit={handleSymptomSubmit}
              />
              
              <div className="mt-8">
                <Card className="p-6 bg-gray-50">
                  <h3 className="font-semibold text-lg mb-4">Your Submission Summary</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Image:</p>
                      <p className="text-gray-600">
                        {selectedImage ? selectedImage.name : "No image uploaded"}
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Reported Symptoms:</p>
                      {symptoms.selected.length > 0 ? (
                        <ul className="list-disc pl-5 text-gray-600">
                          {symptoms.selected.map((symptom, index) => (
                            <li key={index}>{symptom}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">No symptoms selected</p>
                      )}
                    </div>
                    
                    {symptoms.description && (
                      <div>
                        <p className="font-medium">Additional Description:</p>
                        <p className="text-gray-600">{symptoms.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={handleStartAnalysis}
                      disabled={isAnalyzing || !selectedImage}
                      className="w-full bg-mediminds-blue hover:bg-mediminds-darkblue"
                    >
                      {isAnalyzing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        "Start Analysis"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DiagnosisPage;
