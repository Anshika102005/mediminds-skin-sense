
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
              Have a question about our skin cancer detection service? Want to provide feedback?
              Reach out to our team and we will get back to you as soon as possible.
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
                  <h3 className="info-title">Email</h3>
                  <p className="info-text">
                    contact@mediminds.in<br />
                    support@mediminds.in
                  </p>
                </div>
                
                <div className="info-block">
                  <h3 className="info-title">Phone</h3>
                  <p className="info-text">
                    +91 (771) 123-4567<br />
                    +91 (771) 765-4321
                  </p>
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
