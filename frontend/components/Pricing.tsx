"use client";

import { Check, Star } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '€20',
      period: '/maand',
      description: 'Perfect voor kleine ondernemers',
      features: [
        'Persoonlijke AI-assistent',
        'Basis integraties',
        'E-mail support',
      ],
      cta: 'Start gratis',
      highlighted: false,
    },
    {
      name: 'Team',
      price: '€149',
      period: '/maand',
      description: 'Voor groeiende teams',
      features: [
        'Onbeperkte e-mails',
        'Geavanceerde AI-aanpassingen',
        'Alle integraties',
        'Priority support',
        'Team management',
        'Custom workflows',
      ],
      cta: 'Meest gekozen',
      highlighted: true,
    },
    {
      name: 'Custom',
      price: 'Op maat',
      period: '',
      description: 'Enterprise oplossingen',
      features: [
        'Alles uit Team',
        'Dedicated account manager',
        'Custom AI-training',
        'API toegang',
        'SLA garantie',
        'On-premise optie',
      ],
      cta: 'Neem contact op',
      highlighted: false,
    },
  ];

  return (
    <section id="prijzen" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#0B1220] mb-4">Transparante prijzen</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kies het plan dat bij jouw situatie past. Altijd opzegbaar.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200 shadow-lg'
              } transition-all hover:-translate-y-2`}
            >
              {plan.highlighted && (
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 fill-[#10B981] text-[#10B981]" />
                  <span className="text-[#10B981] font-semibold">Populair</span>
                </div>
              )}

              <h3
                className={`text-2xl font-bold mb-2 ${
                  plan.highlighted ? 'text-white' : 'text-[#0B1220]'
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`mb-6 ${
                  plan.highlighted ? 'text-blue-100' : 'text-gray-600'
                }`}
              >
                {plan.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span
                  className={`text-lg ${
                    plan.highlighted ? 'text-blue-100' : 'text-gray-600'
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'text-[#10B981]' : 'text-[#3B82F6]'
                      }`}
                    />
                    <span
                      className={
                        plan.highlighted ? 'text-blue-50' : 'text-gray-700'
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className={`w-full py-4 rounded-full font-semibold transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl ${
                  plan.highlighted
                    ? 'bg-white text-[#3B82F6] hover:bg-blue-50'
                    : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
