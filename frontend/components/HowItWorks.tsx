import { Mail, Brain, Send } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Mail,
      title: '1. Mail komt binnen',
      description: 'Eply ontvangt automatisch je inkomende e-mails en analyseert de inhoud.',
    },
    {
      icon: Brain,
      title: '2. Eply maakt draft',
      description: 'AI maakt een conceptantwoord in jouw toon, op basis van jouw eerdere mails en bedrijfsinformatie.',
    },
    {
      icon: Send,
      title: '3. Jij klikt verzenden',
      description: 'Bekijk het concept, pas aan indien nodig, en verstuur met één klik.',
    },
  ];

  return (
    <section id="wat-is-eply" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#0B1220] mb-4">Wat is Eply?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            In drie simpele stappen van inbox naar professioneel antwoord.
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
            </div>
          ))}
        </div>

        {/* New service highlight section */}
        <div className="mt-16 text-center p-8 rounded-2xl relative overflow-hidden bg-gradient-to-r from-blue-50 to-white">
          {/* Dynamic background effect */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-[#0B1220] mb-4">
              Wij regelen alles voor je
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              In een wereld waar AI razendsnel evolueert, zorgen wij dat jij moeiteloos mee bent.
              We schrijven je prompts, stellen alles in, en begeleiden je tot het werkt zoals jij wil.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
