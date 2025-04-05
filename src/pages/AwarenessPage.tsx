
import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MLTechniquesExplanation from "@/components/MLTechniquesExplanation";

const AwarenessPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Skin Cancer Detection Technology</h1>
        
        <MLTechniquesExplanation />
      </main>
      
      <Footer />
    </div>
  );
};

export default AwarenessPage;
