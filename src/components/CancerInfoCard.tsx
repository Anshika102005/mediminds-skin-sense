
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CancerInfoCardProps {
  title: string;
  description: string;
  imageSrc?: string;
}

const CancerInfoCard = ({ title, description, imageSrc }: CancerInfoCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      {imageSrc && (
        <div className="h-48 overflow-hidden">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          />
        </div>
      )}
      <CardHeader className="pt-6 pb-2">
        <CardTitle className="text-xl font-semibold text-mediminds-darkblue">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
};

export default CancerInfoCard;
