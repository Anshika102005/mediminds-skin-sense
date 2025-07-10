
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "../components/Header";
import Footer from "../components/Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-mediminds-blue to-mediminds-darkblue text-white py-12 md:py-24">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Early Detection Saves Lives
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Use our AI-powered skin cancer detection tool to identify potential
              skin concerns and get quick, reliable results.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                className="bg-white text-mediminds-blue hover:bg-gray-100 text-lg px-6 py-3 h-auto"
                size="lg"
              >
                <Link to="/diagnosis">Try Skin Check</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-6 py-3 h-auto"
                size="lg"
              >
                <Link to="/awareness">Learn About Skin Cancer</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Comprehensive Skin Health Solutions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* AI Detection */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">AI Skin Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our advanced AI technology analyzes your skin images to detect
                  potential signs of skin cancer with high accuracy.
                </p>
                <Button asChild variant="outline">
                  <Link to="/diagnosis">Start Analysis</Link>
                </Button>
              </div>

              {/* Education */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">
                  Educational Resources
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Learn about different types of skin cancer, prevention methods,
                  and treatment options through our comprehensive guides.
                </p>
                <Button asChild variant="outline">
                  <Link to="/awareness">Learn More</Link>
                </Button>
              </div>

              {/* Prevention & Treatment */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-3">Prevention & Treatment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Discover effective prevention strategies and learn about various
                  treatment options available for different types of skin cancer.
                </p>
                <Button asChild variant="outline">
                  <Link to="/awareness">View Resources</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 bg-blue-50 dark:bg-blue-900/20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Take Control of Your Skin Health Today
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Regular checks and early detection are key to successful treatment.
              Start your skin health journey now.
            </p>
            <Button asChild size="lg">
              <Link to="/diagnosis">Get Started</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
