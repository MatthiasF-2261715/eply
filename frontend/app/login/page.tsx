'use client';

import Link from 'next/link';
import { Mail, Server } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function LoginPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/users/profile`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.ok && !res.redirected) {
          // Als de user is ingelogd, redirect naar dashboard
          router.replace('/dashboard');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [BACKEND_URL, router]);

  const handleOutlookLogin = () => {
    try {
      window.location.href = `${BACKEND_URL}/auth/outlook-login`;
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">Laden...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#0B1220] mb-3">Inloggen</h1>
          <p className="text-gray-600">Kies je voorkeursmethode om in te loggen</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 space-y-4">
          <button
            type="button"
            onClick={handleOutlookLogin}
            className="w-full bg-[#0078D4] text-white py-4 px-6 rounded-xl hover:bg-[#106EBE] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Mail className="w-6 h-6" />
            Inloggen met Outlook
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">of</span>
            </div>
          </div>

          <Link 
            href="/imap"
            className="w-full bg-[#3B82F6] text-white py-4 px-6 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Server className="w-6 h-6" />
            Inloggen via IMAP
          </Link>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Nog geen account?{' '}
          <Link 
            href="/#contact"
            className="text-[#3B82F6] hover:underline font-semibold"
          >
            Vraag een demo aan
          </Link>
        </p>
      </div>
    </div>
  );
}