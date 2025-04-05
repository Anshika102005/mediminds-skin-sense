
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MLTechniquesExplanation from "@/components/MLTechniquesExplanation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AwarenessPage = () => {
  const [activeTab, setActiveTab] = useState("types");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-4">Skin Cancer Awareness</h1>
        
        <div className="max-w-4xl mx-auto text-center mb-8">
          <p className="text-lg text-gray-700">
            Understanding skin cancer is the first step towards prevention and early detection. Learn about different 
            types, causes, warning signs, and how to protect yourself.
          </p>
        </div>
        
        <Tabs defaultValue="types" className="max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="warning">Warning Signs</TabsTrigger>
            <TabsTrigger value="prevention">Prevention</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="types">
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
                        src="/lovable-uploads/779b7c04-7d48-4295-9a41-364527074c92.png" 
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
                        src="/lovable-uploads/779b7c04-7d48-4295-9a41-364527074c92.png" 
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
                        src="/lovable-uploads/779b7c04-7d48-4295-9a41-364527074c92.png" 
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
          </TabsContent>
          
          <TabsContent value="warning">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-mediminds-blue mb-4">Warning Signs</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">The ABCDE Rule of Melanoma</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>A - Asymmetry:</strong> One half of the mole doesn't match the other half.</li>
                    <li><strong>B - Border:</strong> The edges are irregular, ragged, notched, or blurred.</li>
                    <li><strong>C - Color:</strong> The color is not the same all over and may include different shades.</li>
                    <li><strong>D - Diameter:</strong> The spot is larger than 6 millimeters across (about 1/4 inch).</li>
                    <li><strong>E - Evolving:</strong> The mole is changing in size, shape, or color.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">Other Warning Signs</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Sores that don't heal</li>
                    <li>Spread of pigment from the border of a spot into surrounding skin</li>
                    <li>Redness or swelling beyond the border of a mole</li>
                    <li>Change in sensation (itchiness, tenderness, or pain)</li>
                    <li>Change in the surface of a mole (scaliness, oozing, bleeding, or appearance of a bump)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prevention">
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
          </TabsContent>
          
          <TabsContent value="treatment">
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
          </TabsContent>
        </Tabs>
        
        <div className="mt-12">
          <MLTechniquesExplanation />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AwarenessPage;
