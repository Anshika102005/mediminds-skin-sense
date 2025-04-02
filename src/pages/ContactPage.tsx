
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

const ContactPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Have questions about our skin cancer detection service? Want to provide feedback?
              Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
              <ContactForm />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Address</h3>
                  <p className="text-gray-600">
                    123 Healthcare Avenue<br />
                    Medical District<br />
                    New York, NY 10001
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Email</h3>
                  <p className="text-gray-600">
                    contact@mediminds.com<br />
                    support@mediminds.com
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Phone</h3>
                  <p className="text-gray-600">
                    +1 (555) 123-4567<br />
                    +1 (555) 765-4321
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Hours</h3>
                  <p className="text-gray-600">
                    Monday to Friday: 9am - 6pm<br />
                    Saturday: 10am - 4pm<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
              
              <div className="mt-8 bg-mediminds-lightgray p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-4">Frequently Asked Questions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">How accurate is the AI diagnosis?</h4>
                    <p className="text-gray-600 text-sm">
                      Our AI system has been trained on thousands of clinical images and has a high accuracy rate. 
                      However, it is designed to be a screening tool and not a replacement for professional medical diagnosis.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Is my data secure?</h4>
                    <p className="text-gray-600 text-sm">
                      Yes, we take data privacy very seriously. All images and personal information are encrypted 
                      and handled in compliance with healthcare data protection standards.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">How can I book an appointment with a specialist?</h4>
                    <p className="text-gray-600 text-sm">
                      After receiving your results, you can use the "Book Appointment" feature to 
                      schedule a consultation with a dermatologist in our partner network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactPage;
