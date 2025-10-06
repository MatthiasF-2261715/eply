import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          <div className="flex justify-start">
            <Link
              to="/"
              className="flex items-center space-x-2 text-[#0B1220] font-bold text-xl"
            >
              <Mail className="w-6 h-6 text-[#3B82F6]" />
              <span>Eply</span>
            </Link>
          </div>

          {isLandingPage && (
            <div className="hidden md:flex items-center justify-center space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-[#0B1220] hover:text-[#3B82F6] transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('over-eply')}
                className="text-[#0B1220] hover:text-[#3B82F6] transition-colors"
              >
                Over Eply
              </button>
              <button
                onClick={() => scrollToSection('prijzen')}
                className="text-[#0B1220] hover:text-[#3B82F6] transition-colors"
              >
                Prijzen
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-[#0B1220] hover:text-[#3B82F6] transition-colors"
              >
                Contact
              </button>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4">
            <Link
              to="/login"
              className="text-[#0B1220] hover:text-[#3B82F6] transition-colors font-medium"
            >
              Login
            </Link>
            {isLandingPage && (
              <button
                onClick={() => scrollToSection('contact')}
                className="bg-[#3B82F6] text-white px-6 py-2 rounded-full hover:bg-[#2563EB] transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                Probeer gratis demo
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
