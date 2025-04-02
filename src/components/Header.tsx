
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-mediminds-blue text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold flex items-center">
          <span className="hidden sm:inline">This website is created by </span>
          <span className="font-bold text-xl">MediMinds</span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/awareness" className="hover:underline">Skin Cancer Awareness</Link>
          <Link to="/contact" className="hover:underline">Contact Us</Link>
        </nav>
        <div className="md:hidden">
          <button className="text-white focus:outline-none">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
