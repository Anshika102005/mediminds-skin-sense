
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ResultCard, { PredictionResult } from "@/components/ResultCard";
import ChatBot from "@/components/ChatBot";

const ResultsPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    // Retrieve result from session storage
    const storedResult = sessionStorage.getItem("diagnosis-result");
    
    if (storedResult) {
      setResult(JSON.parse(storedResult));
    } else {
      // If no result exists, redirect to diagnosis page
      navigate("/diagnosis");
    }
  }, [navigate]);

  if (!result) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-mediminds-blue border-t-transparent rounded-full mb-4"></div>
            <p>Loading your results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Your Analysis Results</h1>
          <p className="text-gray-600">
            Below is the AI assessment of your skin. Remember, this is not a medical diagnosis.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Assessment</h2>
            <ResultCard result={result} />
            
            <div className="mt-8 text-center">
              <Button 
                onClick={() => navigate("/diagnosis")}
                variant="outline" 
                className="mr-4"
              >
                Start New Analysis
              </Button>
              <Button onClick={() => window.print()}>
                Print Results
              </Button>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-6">Ask Our MediBot</h2>
            <ChatBot />
          </div>
        </div>
        
        <div className="mt-16 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> This AI assessment is not a medical diagnosis. If you have concerns about your skin health, please consult with a qualified healthcare provider or dermatologist.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResultsPage;
