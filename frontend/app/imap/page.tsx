'use client';

import { useState } from 'react';

export default function ImapLoginPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    imapServer: '',
    port: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!form.email || !form.password || !form.imapServer || !form.port) {
      setError('Vul alle velden in.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/auth/imap-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // belangrijk voor cookies/sessie
        body: JSON.stringify(form),
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        // Succesvol ingelogd, eventueel redirecten
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Inloggen mislukt.');
      }
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer opnieuw.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">IMAP Inloggen</h1>
        <input
          type="text"
          name="imapServer"
          placeholder="IMAP server (bijv. imap.gmail.com)"
          className="border rounded-lg px-4 py-2"
          value={form.imapServer}
          onChange={handleChange}
        />
        <input
          type="number"
          name="port"
          placeholder="Poort (bijv. 993)"
          className="border rounded-lg px-4 py-2"
          value={form.port}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="E-mailadres"
          className="border rounded-lg px-4 py-2"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Wachtwoord"
          className="border rounded-lg px-4 py-2"
          value={form.password}
          onChange={handleChange}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Bezig met inloggen...' : 'Inloggen'}
        </button>
      </form>
    </main>
  );
}