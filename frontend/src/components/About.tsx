import { Target, Eye } from 'lucide-react';

export default function About() {
  return (
    <section id="over-eply" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-[#0B1220]">Over ons</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Eply is geboren uit frustratie. Als ondernemers besteedden we uren aan het beantwoorden
              van terugkerende e-mails. We wisten: dit kan slimmer.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Met Eply combineren we de nieuwste AI-technologie met een persoonlijke touch.
              Het resultaat? Een tool die écht werkt, tijd bespaart én jouw stem behoudt.
            </p>

            <div className="space-y-6 pt-4">
              <div className="flex gap-4">
                <div className="bg-[#3B82F6] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1220] mb-2">Onze missie</h3>
                  <p className="text-gray-600">
                    E-mailcommunicatie toegankelijk en efficiënt maken voor elke ondernemer.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-[#10B981] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1220] mb-2">Onze visie</h3>
                  <p className="text-gray-600">
                    Een wereld waarin iedereen zich kan focussen op wat hij of zij het beste doet,
                    zonder verloren te gaan in de inbox.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-[#3B82F6] to-[#10B981] rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981]"></div>
                  <div>
                    <h4 className="font-bold text-[#0B1220] text-lg">Yelle & Team</h4>
                    <p className="text-gray-600">Co-founders Eply</p>
                  </div>
                </div>
                <p className="text-gray-600 italic leading-relaxed">
                  "We geloven in slimme technologie die mensen ondersteunt, niet vervangt.
                  Eply geeft je tijd terug voor wat echt belangrijk is."
                </p>
              </div>
            </div>

            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-[#3B82F6]/20 to-[#10B981]/20 blur-3xl rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
