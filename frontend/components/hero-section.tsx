'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Mail, 
  Brain, 
  CheckCircle, 
  Clock, 
  MessageCircle, 
  Shield,
  ArrowRight,
  Users,
  Star,
  Play
} from "lucide-react"

export default function HeroSection() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sneller antwoorden op e-mails, zonder robottaal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI die conceptantwoorden voor je mails voorbereidt, zodat jij enkel nog hoeft te reviewen en verzenden.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Probeer gratis demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              <Play className="mr-2 h-5 w-5" />
              Bekijk hoe het werkt
            </Button>
          </div>
        </div>
      </section>

      {/* Hoe Eply werkt */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hoe Eply werkt</h2>
            <p className="text-gray-600">Drie simpele stappen naar efficiëntere e-mailcommunicatie</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Mail komt binnen</h3>
              <p className="text-gray-600">
                Eply leest mee in je inbox (veilig & privé).
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Draft staat klaar</h3>
              <p className="text-gray-600">
                AI maakt een conceptantwoord in jouw toon, op basis van eerdere mails en bedrijfsinformatie.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Jij beslist</h3>
              <p className="text-gray-600">
                Je reviewt, klikt op verzenden — klaar.
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <p className="text-lg text-gray-700">
                  "Eply leert van jouw eerdere communicatie en bedrijfscontext. 
                  Zo blijven antwoorden consistent, professioneel en herkenbaar."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Waarom Eply? */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Waarom Eply?</h2>
            <p className="text-gray-600">Tastbare voordelen die je direct merkt</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>⏳ Tijd terug</CardTitle>
                <CardDescription>Geen uren meer in je mailbox.</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>💬 Menselijk</CardTitle>
                <CardDescription>Antwoorden voelen persoonlijk, niet robotachtig.</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>🔒 Veilig</CardTitle>
                <CardDescription>Je data blijft van jou.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Wat onze gebruikers zeggen</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg mb-4">
                  "Dit bespaart ons 5 uur per week. De antwoorden voelen echt als onze eigen communicatie."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold">Sarah van der Berg</p>
                    <p className="text-gray-600 text-sm">Customer Success Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg mb-4">
                  "Eindelijk kan ik me focussen op belangrijke taken. Eply neemt de mailstress weg."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold">Mark Jansen</p>
                    <p className="text-gray-600 text-sm">Operations Director</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">Vertrouwd door innovatieve bedrijven</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <Badge variant="outline" className="p-4 text-lg">TechStart B.V.</Badge>
              <Badge variant="outline" className="p-4 text-lg">Innovate Solutions</Badge>
              <Badge variant="outline" className="p-4 text-lg">Digital First</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Wie zijn wij? */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Wie zijn wij?</h2>
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Users className="h-16 w-16 text-white" />
            </div>
            <p className="text-lg text-gray-700 mb-6">
              Wij zijn twee jonge ondernemers die geloven dat AI bedrijven kan helpen zonder de menselijke touch te verliezen. 
              Met Eply bouwen we de toekomst van slimme e-mailcommunicatie.
            </p>
            <p className="text-gray-600">
              Onze missie: tijd winnen zonder menselijkheid te verliezen.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Transparante prijzen</h2>
            <p className="text-gray-600">Investeer in tijd, niet in uren emailen</p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Vanaf €20</CardTitle>
              <CardDescription>per gebruiker per maand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span>Onbeperkte concepten</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span>Leert van jouw toon</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span>Veilige integratie</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span>24/7 support</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Rekensom:</strong> 5 uur per week bespaard × €50/uur = €250 per week. 
                  Eply kost €20 per maand. De investering verdient zich in 2 dagen terug.
                </p>
              </div>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Start gratis demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact / Demo */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Klaar om te beginnen?</h2>
          <p className="text-gray-300 mb-8">
            Boek een persoonlijke demo en zie hoe Eply jouw e-mailstress wegneemt.
          </p>
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input 
                placeholder="Je naam" 
                className="bg-white text-gray-900"
              />
              <Input 
                placeholder="Je e-mailadres" 
                className="bg-white text-gray-900"
              />
            </div>
            <Textarea 
              placeholder="Vertel kort over je bedrijf (optioneel)"
              className="bg-white text-gray-900"
            />
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              Boek een kennismaking
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-gray-400">
              Of mail direct naar: <a href="mailto:info@eply.nl" className="text-blue-400 hover:underline">info@eply.nl</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}