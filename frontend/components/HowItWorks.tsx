import { Mail, Brain, Send } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Mail,
      title: 'Mail komt binnen',
      description: 'Eply ontvangt automatisch je inkomende e-mails en analyseert de inhoud.',
    },
    {
      icon: Brain,
      title: 'Eply maakt draft',
      description: 'Intelligente AI stelt een conceptantwoord op in jouw persoonlijke stijl.',
    },
    {
      icon: Send,
      title: 'Jij klikt verzenden',
      description: 'Bekijk het concept, pas aan indien nodig, en verstuur met één klik.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#0B1220] mb-4">Wat is Eply?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            In drie simpele stappen van inbox naar professioneel antwoord
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-2 h-full">
                <div className="bg-[#3B82F6] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#0B1220] mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#10B981] transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
