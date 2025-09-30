'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const pathname = usePathname();

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: Logo + Eply */}
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full" />
          <Link href="/" className="font-bold text-xl text-blue-700 hover:underline">
            Eply
          </Link>
        </div>
        {/* Center: About Us, Pricing, Learn */}
        <div className="flex-1 flex justify-center space-x-8">
          <Link
            href="/about"
            className={cn(
              'text-gray-700 font-medium hover:text-blue-600 transition',
              pathname === '/about' && 'text-blue-600 underline'
            )}
          >
            About Us
          </Link>
          <Link
            href="/pricing"
            className={cn(
              'text-gray-700 font-medium hover:text-blue-600 transition',
              pathname === '/pricing' && 'text-blue-600 underline'
            )}
          >
            Pricing
          </Link>
          <Link
            href="/learn"
            className={cn(
              'text-gray-700 font-medium hover:text-blue-600 transition',
              pathname === '/learn' && 'text-blue-600 underline'
            )}
          >
            Learn
          </Link>
        </div>
        {/* Right: Login + Boek Een Demo */}
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className={cn(
              'text-gray-700 font-medium hover:text-blue-600 transition',
              pathname === '/login' && 'text-blue-600 underline'
            )}
          >
            Login
          </Link>
          <Link
            href="/boek-demo"
            className="bg-black text-white font-semibold px-5 py-2 rounded-full shadow hover:bg-gray-900 transition"
          >
            Boek Een Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}