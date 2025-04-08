
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from 'lucide-react';
import { Dermatologist } from '../../types/dermatologist';

type DermatologistCardProps = {
  dermatologist: Dermatologist;
  onSelectDermatologist: (dermatologist: Dermatologist) => void;
};

const DermatologistCard = ({ dermatologist, onSelectDermatologist }: DermatologistCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{dermatologist.name}</CardTitle>
            <CardDescription>{dermatologist.specialty}</CardDescription>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded-md flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
            <span>{dermatologist.rating}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{dermatologist.address}, {dermatologist.city}</span>
          {dermatologist.distance && (
            <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 py-0.5 px-2 rounded-full">
              {dermatologist.distance} miles away
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">{dermatologist.bio}</p>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          onClick={() => onSelectDermatologist(dermatologist)}
          className="w-full"
        >
          View Available Times
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DermatologistCard;
