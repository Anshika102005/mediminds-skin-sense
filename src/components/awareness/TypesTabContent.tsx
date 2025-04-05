
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const TypesTabContent = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold text-mediminds-blue mb-4">Types of Skin Cancer</h2>
        <p className="mb-6">
          Skin cancer is the abnormal growth of skin cells, most often developing on skin exposed to 
          the sun. There are several types of skin cancer, each named after the type of skin cell from 
          which they arise.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <img 
                src="/lovable-uploads/cae281f1-7687-4a32-9e0e-384ab9974255.png" 
                alt="Basal Cell Carcinoma" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">Basal Cell Carcinoma</h3>
              <p className="text-gray-700 text-sm">The most common type, usually developing on sun-exposed areas.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <img 
                src="/lovable-uploads/62347964-efa6-4a44-a14e-080bb2c16223.png" 
                alt="Squamous Cell Carcinoma" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">Squamous Cell Carcinoma</h3>
              <p className="text-gray-700 text-sm">The second most common type, appears on sun-exposed areas.</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <img 
                src="/lovable-uploads/dd8906da-ec64-4032-a38c-0ef409411df5.png" 
                alt="Melanoma" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">Melanoma</h3>
              <p className="text-gray-700 text-sm">The most dangerous form that can spread to other organs.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TypesTabContent;
