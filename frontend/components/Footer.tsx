"use client";

import { Mail, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0B1220] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="w-6 h-6 text-[#3B82F6]" />
              <span className="text-xl font-bold">Eply</span>
            </div>
            <p className="text-gray-400 mb-4">
              E-mails beantwoorden op autopilot. Slimmer werken, meer tijd voor wat telt.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#3B82F6] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#3B82F6] transition-colors"
              >
                <Twitter className="w-5 h-5" />
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
              <li>info@eply.nl</li>
              <li>+31 6 12345678</li>
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
