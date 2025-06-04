
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import tab content components
import TypesTabContent from "@/components/awareness/TypesTabContent";
import WarningSignsTabContent from "@/components/awareness/WarningSignsTabContent";
import PreventionTabContent from "@/components/awareness/PreventionTabContent";
import TreatmentTabContent from "@/components/awareness/TreatmentTabContent";

const AwarenessPage = () => {
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
            <TypesTabContent />
          </TabsContent>
          
          <TabsContent value="warning">
            <WarningSignsTabContent />
          </TabsContent>
          
          <TabsContent value="prevention">
            <PreventionTabContent />
          </TabsContent>
          
          <TabsContent value="treatment">
            <TreatmentTabContent />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default AwarenessPage;
