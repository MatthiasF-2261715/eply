"use client";

import { Clock, MessageSquare, Shield } from 'lucide-react';

export default function WhyEply() {
  const features = [
    {
      icon: Clock,
      title: 'Tijdswinst',
      description: 'Bespaar uren per week aan je e-mails. Meer focus voor wat echt telt.',
    },
    {
      icon: MessageSquare,
      title: 'Menselijke toon',
      description: 'Eply leert jouw schrijfstijl en zorgt voor persoonlijke, authentieke antwoorden.',
    },
    {
      icon: Shield,
      title: 'Veiligheid',
      description: 'We gaan zorgvuldig om met jouw data. Jouw gegevens blijven privé en veilig.',
    },
  ];

  return (
    <section id="waarom" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#0B1220] mb-4">Waarom Eply?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Minder werken aan je e-mails, zonder kwaliteitsverlies
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100"
            >
              <div className="bg-gradient-to-br from-[#3B82F6] to-[#10B981] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1220] mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl p-12 shadow-xl border border-gray-100">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h3 className="text-3xl font-bold text-[#0B1220]">
              De toekomst mailt slimmer -- jij ook?
            </h3>
            <p className="text-xl text-gray-600">
              Probeer het zelf. Je mailbox zal nooit meer hetzelfde zijn.
            </p>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#3B82F6] text-white px-10 py-4 rounded-full hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              Start gratis demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
