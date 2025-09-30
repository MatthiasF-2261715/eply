"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 flex items-center">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-blue-700 mb-2">Over Eply</CardTitle>
            <div className="flex gap-4 items-center mt-2">
              <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">Matthias Foesters - CTO & Co-Founder</div>
              <div className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">Yelle D'Helft - CEO & Co-Founder</div>
            </div>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wie zijn wij?</h2>
            <p className="mb-6 text-gray-700">
              Wij zijn Eply, een jong en ambitieus team dat bedrijven helpt om sneller en consistenter te antwoorden op e-mails met behoud van de menselijke touch.
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wat doen we?</h2>
            <p className="mb-6 text-gray-700">
              Onze slimme AI-assistent genereert conceptantwoorden op basis van bedrijfsinformatie en eerdere communicatie. Medewerkers hoeven enkel te reviewen en te verzenden, waardoor teams tijd besparen en de merkidentiteit behouden blijft.
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Voor wie?</h2>
            <p className="mb-2 text-gray-700">
              Eply is er voor KMO’s die veel e-mailen en hun communicatie willen professionaliseren met behulp van AI, maar altijd met de mens aan het stuur.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}