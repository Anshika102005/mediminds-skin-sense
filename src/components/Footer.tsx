
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-mediminds-darkblue text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">MediMinds</h3>
            <p className="text-sm">
              Pioneering early skin cancer detection through AI-powered technology
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/diagnosis" className="hover:underline">Start Diagnosis</Link></li>
              <li><Link to="/awareness" className="hover:underline">Skin Cancer Awareness</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Disclaimer</h3>
            <p className="text-sm">
              This tool is designed to assist with early detection but is not a replacement for professional medical advice.
              Always consult with a healthcare provider for proper diagnosis.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
          <p>© {new Date().getFullYear()} MediMinds Skin Sense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
