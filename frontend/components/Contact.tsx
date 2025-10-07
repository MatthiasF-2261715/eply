"use client";

import { useState } from 'react';
import { Mail, User, MessageSquare, Send } from 'lucide-react';

const WEB3FORMS_ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg?: string }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: 'error', msg: 'Vul naam, e-mail en bericht in.' });
      return;
    }
    setStatus({ type: 'loading' });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('access_key', WEB3FORMS_ACCESS_KEY || '');
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('botcheck', '');

      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Versturen mislukt.');
      }

      setStatus({ type: 'success', msg: 'Bericht verstuurd. We nemen snel contact op.' });
      setFormData({ name: '', email: '', message: '' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Er ging iets mis.' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#0B1220] mb-4">
            Klaar om te starten?
          </h2>
          <p className="text-xl text-gray-600">
            Boek een gratis demo en ontdek wat Eply voor jou kan betekenen
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100">
          {status.type === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1220] mb-2">
                Bedankt voor je aanvraag!
              </h3>
              <p className="text-gray-600">
                We nemen zo snel mogelijk contact met je op.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY || ''} />
              <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              <div>
                <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                  Naam *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                    placeholder="Jouw naam"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                    placeholder="jouw@email.nl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                  Bericht *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Vertel ons over je situatie..."
                  />
                </div>
              </div>

              {status.type === 'error' && (
                <div className="text-sm text-red-600">{status.msg}</div>
              )}

              <button
                type="submit"
                disabled={status.type === 'loading'}
                className="w-full bg-[#3B82F6] text-white py-4 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl font-semibold text-lg flex items-center justify-center gap-2"
              >
                {status.type === 'loading' ? 'Verzenden...' : 'Verstuur aanvraag'}
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}