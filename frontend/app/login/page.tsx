'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function LoginPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/users/profile`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.ok && !res.redirected) {
          router.replace('/dashboard');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [BACKEND_URL, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.replace('/dashboard');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <p className="text-gray-600">Log in met je e-mailadres</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mailadres
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#3B82F6] text-white py-4 px-6 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg font-semibold"
            >
              Inloggen
            </button>
          </form>

          <div className="mt-6">
            <Link 
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline block text-center"
            >
              Wachtwoord vergeten?
            </Link>
          </div>
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