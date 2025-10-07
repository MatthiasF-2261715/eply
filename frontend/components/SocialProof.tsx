import { Building2, Users, Zap } from 'lucide-react';

export default function SocialProof() {
  const stats = [
    { value: '500+', label: 'E-mails per dag', icon: Zap },
    { value: '50+', label: 'Tevreden gebruikers', icon: Users },
    { value: '70%', label: 'Tijdwinst', icon: Building2 },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0B1220] mb-4">Vertrouwd door ondernemers</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-gray-100"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3B82F6] mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-bold text-[#3B82F6] mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
