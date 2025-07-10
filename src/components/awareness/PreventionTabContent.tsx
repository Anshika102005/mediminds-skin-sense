
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const PreventionTabContent = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold text-mediminds-blue mb-4">Prevention Strategies</h2>
        
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-3 text-mediminds-darkblue">Sun Protection Essentials</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Apply broad-spectrum sunscreen with SPF 30+ daily, even on cloudy days</li>
                <li>Reapply sunscreen every 2 hours or after swimming/sweating</li>
                <li>Seek shade between 10 a.m. and 4 p.m. when UV rays are strongest</li>
                <li>Wear protective clothing: long sleeves, wide-brimmed hats (4+ inches)</li>
                <li>Use UV-blocking sunglasses that block 99-100% of UV rays</li>
                <li>Avoid tanning beds and sunlamps completely</li>
                <li>Be extra careful around water, snow, and sand that reflect UV rays</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-3 text-green-700">Regular Screening & Self-Care</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Perform monthly self-examinations of your entire body</li>
                <li>Visit a dermatologist annually for professional skin checks</li>
                <li>Know your personal risk factors (family history, fair skin, many moles)</li>
                <li>Document and photograph suspicious moles or changes</li>
                <li>Check often-missed areas: scalp, between toes, under nails</li>
                <li>Use the ABCDE rule to evaluate moles regularly</li>
                <li>Report any concerning changes to a healthcare provider immediately</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 mb-2">High-Risk Groups Should Take Extra Precautions:</h4>
            <ul className="text-yellow-800 list-disc pl-6 space-y-1">
              <li>People with fair skin, light hair, and light eyes</li>
              <li>Those with a family history of skin cancer</li>
              <li>Individuals with many moles or atypical moles</li>
              <li>People with a history of severe sunburns</li>
              <li>Those with weakened immune systems</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-800">
            <strong>Remember:</strong> Early detection dramatically improves treatment outcomes. When caught early, 
            the 5-year survival rate for melanoma is over 99%. Our AI-powered detection tool can help identify 
            potential issues, but always consult with a dermatologist for proper diagnosis and treatment planning.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreventionTabContent;
