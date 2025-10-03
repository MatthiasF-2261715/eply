'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    <nav className="w-full bg-[#f1f0ee]">
      <div className="max-w-none mx-auto px-20 py-4 flex items-center justify-between">
        {/* Links: Logo + Eply */}
        <div className="flex items-center space-x-1">
          <Link href="/" className="font-bold text-lg text-black ml-1">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 rounded-md" />
          </Link>
        </div>
        {/* Midden: About Us, Pricing, Learn */}
        <div className="flex items-center space-x-8">
          <Link
            href="/about"
            className={cn(
              'text-gray-700 text-sm px-3 py-2 rounded-md transition hover:bg-gray-100',
              pathname === '/about' && 'bg-gray-100'
            )}
          >
            About Us
          </Link>
          <Link
            href="/pricing"
            className={cn(
              'text-gray-700 text-sm px-3 py-2 rounded-md transition hover:bg-gray-100',
              pathname === '/pricing' && 'bg-gray-100'
            )}
          >
            Pricing
          </Link>
          <Link
            href="/learn"
            className={cn(
              'text-gray-700 text-sm px-3 py-2 rounded-md transition hover:bg-gray-100',
              pathname === '/learn' && 'bg-gray-100'
            )}
          >
            Learn
          </Link>
        </div>
        {/* Rechts: Login/Boek een Demo of Dashboard */}
        <div className="flex items-center space-x-4">
          {!loading && !isAuthenticated && (
            <>
              <Link
                href="/login"
                className={cn(
                  'text-gray-700 text-sm px-3 py-2 rounded-md transition hover:bg-gray-100'
                )}
              >
                Login
              </Link>
              <Link
                href="/contact"
                className="bg-black text-white font-semibold text-sm px-4 py-2 rounded-md hover:bg-gray-900 transition"
                style={{ borderRadius: '6px' }}
              >
                Boek Een Demo
              </Link>
            </>
          )}
          {!loading && isAuthenticated && (
            <Link
              href="/dashboard"
              className="bg-black text-white font-semibold text-sm px-4 py-2 rounded-md hover:bg-gray-900 transition"
              style={{ borderRadius: '6px' }} 
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}