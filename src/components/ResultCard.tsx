
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type PredictionResult = {
  prediction: "Normal" | "Benign" | "Malignant";
  confidence: number;
  risk: "low" | "medium" | "high";
};

interface ResultCardProps {
  result: PredictionResult;
}

const ResultCard = ({ result }: ResultCardProps) => {
  const getResultColor = () => {
    switch (result.prediction) {
      case "Normal":
        return "bg-mediminds-green";
      case "Benign":
        return "bg-yellow-500";
      case "Malignant":
        return "bg-mediminds-red";
      default:
        return "bg-mediminds-blue";
    }
  };

  const getRecommendation = () => {
    switch (result.risk) {
      case "high":
        return "Consult a dermatologist immediately";
      case "medium":
        return "Schedule a dermatologist appointment within 2 weeks";
      case "low":
        return "Monitor and check again after 2 weeks";
      default:
        return "Follow up with a healthcare provider";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
      <CardHeader className={`${getResultColor()} text-white text-center py-6`}>
        <CardTitle className="text-2xl font-bold">
          {result.prediction}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <div className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
            Confidence Score: {result.confidence}%
          </div>
        </div>
        
        <div className="border-t border-b border-gray-200 py-4">
          <h3 className="font-semibold text-lg mb-2">Recommendation:</h3>
          <p className="text-gray-700">{getRecommendation()}</p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button variant="outline">
            Save Result
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
