export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 pb-16"> {/* Added padding for navbar */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
            
            <div className="space-y-8">
              <section className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cookie Gebruik</h2>
                <p className="text-gray-600 mb-4">Wij gebruiken de volgende cookies:</p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-3"><strong>Essentiële cookies:</strong> Noodzakelijk voor basisfunctionaliteit</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-3"><strong>Sessie cookies:</strong> Voor het beheren van uw login status</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-3"><strong>Analytische cookies:</strong> Voor het verbeteren van onze diensten</span>
                  </li>
                </ul>
              </section>

              <section className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Gegevensverwerking</h2>
                <p className="text-gray-600 mb-4">We verwerken uw gegevens volgens de GDPR-richtlijnen:</p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-3">Uw data wordt veilig opgeslagen binnen de EU</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-3">U heeft recht op inzage, correctie en verwijdering van uw gegevens</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-indigo-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="ml-3">We bewaren uw gegevens niet langer dan noodzakelijk</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact</h2>
                <p className="text-gray-600 mb-2">Voor vragen over privacy kunt u contact opnemen via:</p>
                <a 
                  href="mailto:privacy@eply.be" 
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  info@eply.be
                </a>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}