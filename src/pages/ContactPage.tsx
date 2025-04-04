
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import "../styles/ContactPage.css";

const ContactPage = () => {
  return (
    <div className="contact-page">
      <Header />
      
      <main className="contact-main">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-description">
              Have questions about our skin cancer detection service? Want to provide feedback?
              Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
          
          <div className="contact-grid">
            <div className="contact-form-section">
              <h2 className="section-title">Send Us a Message</h2>
              <ContactForm />
            </div>
            
            <div className="contact-info-section">
              <h2 className="section-title">Contact Information</h2>
              
              <div className="contact-info-card">
                <div className="info-block">
                  <h3 className="info-title">Address</h3>
                  <p className="info-text">
                    Kalinga University<br />
                    Academic Block<br />
                    Raipur, Chhattisgarh 492101
                  </p>
                </div>
                
                <div className="info-block">
                  <h3 className="info-title">Email</h3>
                  <p className="info-text">
                    contact@kalingauniversity.ac.in<br />
                    support@kalingauniversity.ac.in
                  </p>
                </div>
                
                <div className="info-block">
                  <h3 className="info-title">Phone</h3>
                  <p className="info-text">
                    +91 (771) 123-4567<br />
                    +91 (771) 765-4321
                  </p>
                </div>
                
                <div className="info-block">
                  <h3 className="info-title">Hours</h3>
                  <p className="info-text">
                    Monday to Friday: 9am - 5pm<br />
                    Saturday: 10am - 2pm<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
              
              <div className="faq-section">
                <h3 className="faq-title">Frequently Asked Questions</h3>
                
                <div className="faq-list">
                  <div className="faq-item">
                    <h4 className="faq-question">How accurate is the AI diagnosis?</h4>
                    <p className="faq-answer">
                      Our AI system has been trained on thousands of clinical images and has a high accuracy rate. 
                      However, it is designed to be a screening tool and not a replacement for professional medical diagnosis.
                    </p>
                  </div>
                  
                  <div className="faq-item">
                    <h4 className="faq-question">Is my data secure?</h4>
                    <p className="faq-answer">
                      Yes, we take data privacy very seriously. All images and personal information are encrypted 
                      and handled in compliance with healthcare data protection standards.
                    </p>
                  </div>
                  
                  <div className="faq-item">
                    <h4 className="faq-question">How can I book an appointment with a specialist?</h4>
                    <p className="faq-answer">
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
