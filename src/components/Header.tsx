
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-mediminds-blue text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold flex items-center">
          <span className="hidden sm:inline">This website is created by </span>
          <span className="font-bold text-xl">MediMinds</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/diagnosis" className="hover:underline">Skin Check</Link>
          <Link to="/awareness" className="hover:underline">Skin Cancer Awareness</Link>
          <Link to="/contact" className="hover:underline">Contact Us</Link>
        </nav>
        
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-mediminds-darkblue p-2"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-mediminds-blue border-t border-mediminds-darkblue">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-3 py-3">
              <Link to="/" className="hover:underline py-1" onClick={toggleMenu}>Home</Link>
              <Link to="/diagnosis" className="hover:underline py-1" onClick={toggleMenu}>Skin Check</Link>
              <Link to="/awareness" className="hover:underline py-1" onClick={toggleMenu}>Skin Cancer Awareness</Link>
              <Link to="/contact" className="hover:underline py-1" onClick={toggleMenu}>Contact Us</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
