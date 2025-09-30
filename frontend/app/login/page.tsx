'use client';

import Link from 'next/link';

export default function LoginPage() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Login</h1>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => window.location.href = `${BACKEND_URL}/auth/outlook-login`}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Inloggen met Outlook
          </button>
          <Link href="/imap" legacyBehavior>
            <a
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition border border-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Inloggen via IMAP
            </a>
          </Link>
        </div>
      </div>
    </main>
  );
}