"use client";

import { Mail, Linkedin, Phone, Instagram, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B1220] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Eply logo" className="w-20 h-20" />
            </div>
            <p className="text-gray-400 mb-4">
              Eply analyseert je inkomende e-mails en stelt direct professionele concepten voor — in jouw toon.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.linkedin.com/company/eplybe/posts/?feedView=all"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#3B82F6] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/eply.be/"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#3B82F6] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button
                  onClick={() => document.getElementById('over-eply')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#3B82F6] transition-colors"
                >
                  Over Eply
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('prijzen')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#3B82F6] transition-colors"
                >
                  Prijzen
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#3B82F6] transition-colors"
                >
                  Demo boeken
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a 
                  href="mailto:info@eply.be"
                  className="hover:text-[#3B82F6] transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  info@eply.be
                </a>
              </li>
              <li>
                <a 
                  href="tel:+32472362518"
                  className="hover:text-[#3B82F6] transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  +32 472 36 25 18
                </a>
              </li>
              <li>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Herengracht+59,+3665+As,+Belgium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#3B82F6] transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Herengracht 59, 3665 As
                </a>
              </li>
              <li>BE 1027.205.452</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
          <p>&copy; 2025 Eply. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
}
