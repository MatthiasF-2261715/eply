"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    fetch(`${backendUrl}/users/profile`, { credentials: 'include' })
      .then(res => {
        if (res.status === 200) {
          setIsAuthenticated(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scrollToSection = (id: string) => {
    if (pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }
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
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Eply Logo"
                width={100}
                height={32}
                priority
              />
            </Link>
          </div>

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

          <div className="flex items-center justify-end space-x-4">
            {!loading && !isAuthenticated ? (
              <>
                <Link href="/login" className="text-[#0B1220] hover:text-[#3B82F6] transition-colors font-medium">
                  Login
                </Link>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="bg-[#3B82F6] text-white px-6 py-2 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  Boek een Demo
                </button>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="bg-[#3B82F6] text-white px-6 py-2 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}