import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Mail, Lock, Hash } from 'lucide-react';

export default function ImapLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    server: '',
    port: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#0B1220] mb-3">IMAP Configuratie</h1>
          <p className="text-gray-600">Vul je IMAP-gegevens in om te verbinden</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                IMAP Server *
              </label>
              <div className="relative">
                <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="server"
                  value={formData.server}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="imap.gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                Port *
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="993"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                E-mail *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="jouw@email.nl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                Wachtwoord *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#3B82F6] text-white py-4 rounded-xl hover:bg-[#2563EB] transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl font-semibold text-lg"
            >
              Verbinden
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
