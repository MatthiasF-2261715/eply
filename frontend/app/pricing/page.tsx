"use client"

export default function PricingPage() {
  return (
    <div className="min-h-screen py-16 px-4 flex items-center">
      <div className="max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-10">Prijzen</h1>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Standaard prijs */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Standaard</h2>
            <p className="text-5xl font-bold text-blue-600 mb-2">€20</p>
            <p className="text-gray-500 mb-4">per account / maand</p>
            <ul className="mb-6 text-gray-700 list-disc pl-4 text-left w-full">
              <li>Alle basisfunctionaliteiten</li>
              <li>Snelle onboarding</li>
              <li>Support via e-mail</li>
            </ul>
          </div>
          {/* Enterprise prijs */}
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Enterprise</h2>
            <p className="text-3xl font-bold text-purple-600 mb-2">Op aanvraag</p>
            <p className="text-gray-500 mb-4">Voor grotere teams & maatwerk</p>
            <ul className="mb-6 text-gray-700 list-disc pl-4 text-left w-full">
              <li>Alle standaard features</li>
              <li>Custom integraties</li>
              <li>Persoonlijke onboarding</li>
              <li>Premium support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}