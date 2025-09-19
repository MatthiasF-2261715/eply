'use client';

import React from 'react';

const INFO_EMAIL = 'info@eply.be';
const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

export default function Contact() {
  const [result, setResult] = React.useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult('Verzenden...');
    const formData = new FormData(event.target as HTMLFormElement);

    formData.append('access_key', WEB3FORMS_ACCESS_KEY || '');

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      setResult('Bericht succesvol verzonden!');
      (event.target as HTMLFormElement).reset();
    } else {
      setResult(data.message || 'Er ging iets mis.');
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
        <form onSubmit={onSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            required
            placeholder="Je naam"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="jij@voorbeeld.com"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="message"
            required
            rows={6}
            placeholder="Schrijf hier je bericht..."
            className="w-full resize-y rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 text-white text-sm font-medium px-6 py-3 hover:bg-blue-700 transition"
          >
            Verstuur bericht
          </button>
        </form>
        <span className="block text-center text-sm text-gray-600">{result}</span>
        <div className="text-xs text-gray-400 text-center">
          Je kunt ook direct mailen naar {INFO_EMAIL}
        </div>
      </div>
    </main>
  );
}