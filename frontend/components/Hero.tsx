"use client";

import { ArrowRight, Inbox, Sparkles } from 'lucide-react';

export default function Hero() {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-[#0B1220] leading-tight">
              Waar AI stopt met praten als een <span className="text-[#3B82F6]">robot</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Eply analyseert je inkomende e-mails en stelt direct professionele concepten voor — in jouw toon.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={scrollToContact}
                className="bg-[#3B82F6] text-white px-8 py-4 rounded-full hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg font-semibold"
              >
                Boek demo
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('wat-is-eply')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-[#3B82F6] text-[#3B82F6] px-8 py-4 rounded-full hover:bg-blue-50 transition-all text-lg font-semibold"
              >
                Hoe het werkt
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Inbox className="w-8 h-8 text-[#3B82F6]" />
                <h3 className="text-lg font-semibold text-[#0B1220]">Inbox</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-[#3B82F6] transform hover:scale-105 transition-transform">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-[#0B1220] mb-1">Nieuwe offerte-aanvraag</p>
                      <p className="text-sm text-gray-600">Van: klant@bedrijf.be</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-[#10B981] animate-pulse" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-[#10B981] font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Concept klaar om te verzenden
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl opacity-70">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-[#0B1220] mb-1">Follow-up vraag</p>
                      <p className="text-sm text-gray-600">Van: contact@startup.com</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl opacity-70">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-[#0B1220] mb-1">Vergaderbevestiging</p>
                      <p className="text-sm text-gray-600">Van: team@partner.be</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-[#3B82F6]/20 to-[#10B981]/20 blur-3xl rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
