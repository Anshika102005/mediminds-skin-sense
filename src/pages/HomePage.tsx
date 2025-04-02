
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-mediminds-blue to-mediminds-darkblue text-white py-20">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Early Skin Cancer Detection with AI Technology
              </h1>
              <p className="text-xl">
                Upload a photo of your skin concern and get an instant AI-powered assessment to help identify potential skin cancer.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <Button asChild size="lg" className="bg-white text-mediminds-darkblue hover:bg-gray-100">
                  <Link to="/diagnosis">Let's Start</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                  <Link to="/awareness">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1577375729152-4c8b5fcda381?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="AI Skin Analysis" 
                className="rounded-lg shadow-xl max-w-sm"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-mediminds-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">Upload an Image</h3>
                <p className="text-gray-600">
                  Take a clear photo of the skin area you're concerned about and upload it to our secure platform.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-mediminds-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
                <p className="text-gray-600">
                  Our advanced AI algorithms analyze the image and your symptoms to detect potential skin cancer indicators.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-mediminds-blue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">Get Results</h3>
                <p className="text-gray-600">
                  Receive an instant assessment with a detailed report and recommended next steps.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <Button asChild size="lg" className="bg-mediminds-blue hover:bg-mediminds-darkblue">
                <Link to="/diagnosis">Start Your Skin Check</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose MediMinds</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-mediminds-darkblue">Advanced AI Technology</h3>
                <p className="text-gray-600">
                  Powered by state-of-the-art machine learning algorithms trained on thousands of clinical images.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-mediminds-darkblue">Privacy Focused</h3>
                <p className="text-gray-600">
                  Your data and images are securely encrypted and never shared with third parties.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-mediminds-darkblue">Early Detection</h3>
                <p className="text-gray-600">
                  Early detection of skin cancer can significantly increase treatment success rates and save lives.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-mediminds-darkblue">Medical Support</h3>
                <p className="text-gray-600">
                  Connect with qualified dermatologists for follow-up consultations based on your results.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-mediminds-darkblue">Quick & Convenient</h3>
                <p className="text-gray-600">
                  Get results in minutes from the comfort of your home, without waiting for an appointment.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3 text-mediminds-darkblue">Continuous Learning</h3>
                <p className="text-gray-600">
                  Our AI system continuously improves its accuracy through ongoing training and validation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-mediminds-darkblue text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to check your skin?</h2>
            <p className="text-xl max-w-2xl mx-auto mb-8">
              Early detection is crucial for effective treatment. Take the first step towards protecting your skin health today.
            </p>
            <Button asChild size="lg" className="bg-white text-mediminds-darkblue hover:bg-gray-100">
              <Link to="/diagnosis">Start Now</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
