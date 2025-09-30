import { Mail, Linkedin,  Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & CTA */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Eply</h3>
            <p className="text-gray-600 mb-6">
              AI die conceptantwoorden voor je mails voorbereidt, zodat jij enkel nog hoeft te reviewen en verzenden.
            </p>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <div className="space-y-2">
              <p className="text-gray-600">info@eply.nl</p>
              <div className="flex space-x-4 mt-4">
                <a href="https://www.linkedin.com/company/eplybe/posts/?feedView=all" className="text-gray-400 hover:text-gray-600">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/eply.be/" className="text-gray-400 hover:text-gray-600">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="mailto:info@eply.nl" className="text-gray-400 hover:text-gray-600">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Juridisch</h4>
            <div className="space-y-2">
              <a href="/privacy" className="text-gray-600 hover:text-gray-900 block">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-600 hover:text-gray-900 block">
                Algemene Voorwaarden
              </a>
              <a href="/cookies" className="text-gray-600 hover:text-gray-900 block">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © 2025 Eply. Alle rechten voorbehouden.
          </p>
          <p className="text-gray-500 text-sm">
            Made in Belgium
          </p>
        </div>
      </div>
    </footer>
  )
}