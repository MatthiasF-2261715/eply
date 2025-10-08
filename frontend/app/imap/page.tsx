'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Server, Mail, Lock, Hash } from 'lucide-react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function ImapLoginPage() {
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    imapServer: '',
    port: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">Laden...</span>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/imap-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      if (res.ok) {
        handleSuccess('Succesvol ingelogd!');
        router.push('/dashboard');
      } else {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
        throw new Error(data.error || 'Inloggen mislukt.');
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#0B1220] mb-3">IMAP Configuratie</h1>
          <p className="text-gray-600">Vul je IMAP-gegevens in om te verbinden</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                IMAP Server *
              </label>
              <div className="relative">
                <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="imapServer"
                  value={form.imapServer}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="imap.gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">Port *</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="port"
                  value={form.port}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="993"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">E-mail *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="jouw@email.nl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">Wachtwoord *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3B82F6] text-white py-4 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-60"
            >
              {isSubmitting ? 'Bezig met verbinden...' : 'Verbinden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}