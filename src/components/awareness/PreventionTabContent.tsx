
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const PreventionTabContent = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold text-mediminds-blue mb-4">Prevention</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Sun Protection</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Apply broad-spectrum sunscreen with SPF 30+ daily</li>
              <li>Seek shade, especially between 10 a.m. and 4 p.m.</li>
              <li>Wear protective clothing (long sleeves, wide-brimmed hats)</li>
              <li>Use UV-blocking sunglasses</li>
              <li>Avoid tanning beds and sunlamps</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Regular Screening</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Perform monthly self-examinations of your skin</li>
              <li>Visit a dermatologist annually for professional skin checks</li>
              <li>Know your risk factors (family history, fair skin, etc.)</li>
              <li>Document changes in existing moles or spots</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreventionTabContent;
