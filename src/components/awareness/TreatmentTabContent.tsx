
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const TreatmentTabContent = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold text-mediminds-blue mb-4">Treatment</h2>
        
        <p className="mb-4">Treatment options depend on the type, size, location, and stage of skin cancer. Common approaches include:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Surgical Options</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Excisional surgery:</strong> Cutting out the cancerous tissue</li>
              <li><strong>Mohs surgery:</strong> Removing skin layer by layer</li>
              <li><strong>Curettage and electrodesiccation:</strong> Scraping and burning cancer cells</li>
              <li><strong>Cryosurgery:</strong> Freezing cancer cells</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Other Treatments</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Radiation therapy:</strong> Using high-energy beams</li>
              <li><strong>Chemotherapy:</strong> Using drugs to kill cancer cells</li>
              <li><strong>Immunotherapy:</strong> Boosting your immune system</li>
              <li><strong>Photodynamic therapy:</strong> Using drugs and light</li>
              <li><strong>Biological therapy:</strong> Using medications to stimulate immune response</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-yellow-800">
            <strong>Early detection is critical:</strong> When found early, skin cancer is highly 
            treatable. Our AI-powered detection tool can help identify potential issues, but always 
            consult with a dermatologist for proper diagnosis and treatment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentTabContent;
