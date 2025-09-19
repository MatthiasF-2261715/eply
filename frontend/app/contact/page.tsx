'use client';

import React, { useState } from 'react';

const INFO_EMAIL = 'info@eply.be';

const FORM_SUBMIT_ID = process.env.NEXT_PUBLIC_FORM_SUBMIT_ID;
const FORM_SUBMIT_URL = `https://formsubmit.co/${FORM_SUBMIT_ID}`;

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState(''); 
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg?: string }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setStatus({ type: 'error', msg: 'Vul naam, e-mail en bericht in.' });
      return;
    }
    setStatus({ type: 'loading' });

    try {
      const params = new URLSearchParams();
      params.append('name', name);
      params.append('email', email);
      params.append('message', message);

      const res = await fetch(FORM_SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Versturen mislukt.');
      }

      setStatus({ type: 'success', msg: 'Bericht verstuurd. We nemen snel contact op.' });
      setMessage('');
      setName('');
      setEmail('');
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Er ging iets mis.' });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-lg bg-white shadow-md rounded-xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contacteer ons</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Heb je een vraag, idee of opmerking? Stuur ons een bericht via het formulier hieronder
              of mail ons rechtstreeks op{' '}
              <a
                href={`mailto:${INFO_EMAIL}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {INFO_EMAIL}
              </a>.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Naam</label>
            <input
              id="name"
              type="text"
              required
              placeholder="Je naam"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Jouw e-mailadres</label>
            <input
              id="email"
              type="email"
              required
              placeholder="jij@voorbeeld.com"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-gray-700">Bericht</label>
            <textarea
              id="message"
              required
              rows={6}
              placeholder="Schrijf hier je bericht..."
              className="w-full resize-y rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

            {status.type === 'error' && (
              <div className="text-sm text-red-600">{status.msg}</div>
            )}
            {status.type === 'success' && (
              <div className="text-sm text-green-600">{status.msg}</div>
            )}

          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-medium px-6 py-3 hover:bg-blue-700 transition disabled:opacity-60"
          >
            {status.type === 'loading' ? 'Verzenden...' : 'Verstuur bericht'}
          </button>
        </form>

        <div className="text-xs text-gray-400 text-center">
          Je kunt ook direct mailen naar {INFO_EMAIL}
        </div>
      </div>
    </main>
  );
}