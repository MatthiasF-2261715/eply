export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="space-y-4">
        <section>
          <h2 className="text-xl font-semibold mb-2">Cookie Gebruik</h2>
          <p>Wij gebruiken de volgende cookies:</p>
          <ul className="list-disc pl-5 mt-2">
            <li><strong>Essentiële cookies:</strong> Noodzakelijk voor basisfunctionaliteit</li>
            <li><strong>Sessie cookies:</strong> Voor het beheren van uw login status</li>
            <li><strong>Analytische cookies:</strong> Voor het verbeteren van onze diensten</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">Gegevensverwerking</h2>
          <p>We verwerken uw gegevens volgens de GDPR-richtlijnen:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Uw data wordt veilig opgeslagen binnen de EU</li>
            <li>U heeft recht op inzage, correctie en verwijdering van uw gegevens</li>
            <li>We bewaren uw gegevens niet langer dan noodzakelijk</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <p>Voor vragen over privacy kunt u contact opnemen via:</p>
          <p>Email: privacy@eply.be</p>
        </section>
      </div>
    </div>
  );
}