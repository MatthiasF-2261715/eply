import { Mail, ArrowRight, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Email {
  id: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  time: string;
}

export default function Dashboard() {
  const emails: Email[] = [
    {
      id: 1,
      subject: 'Intern',
      from: 'matthias@eply.be',
      to: 'yelle@eply.be',
      date: '6 okt',
      time: '10:40',
    },
    {
      id: 2,
      subject: "Bevestiging van uw afspraak bij Mr. Pascal D'Helft op woensdag 15/10/2025 om 10:00 - D'Helft Yelle",
      from: '"Appoint" <noreply@appoint.be>',
      to: 'yelle@eply.be',
      date: '4 okt',
      time: '22:37',
    },
    {
      id: 3,
      subject: 'Re: Juiste mail',
      from: '"Koen Evers" <koen.evers@befrako.be>',
      to: 'yelle@eply.be',
      date: '3 okt',
      time: '20:35',
    },
    {
      id: 4,
      subject: "Yelle D'helft komt langs om 11u",
      from: '"Koen Evers" <koen.evers@befrako.be>',
      to: 'yelle@eply.be',
      date: '3 okt',
      time: '20:34',
    },
    {
      id: 5,
      subject: 'Re: Boek jouw Eply-demo vanaf 3 oktober',
      from: '"Katherina Kitsinis" <katherina@kinisi.be>',
      to: 'yelle@eply.be',
      date: '25 sep',
      time: '15:02',
    },
    {
      id: 6,
      subject: 'RE: Gratis Demo Eply Testen?',
      from: '"Peter Van Eylen | 5Dsolutions" <peter.vaneylen@5Dsolutions.be>',
      to: 'yelle@eply.be',
      date: '24 sep',
      time: '16:59',
    },
    {
      id: 7,
      subject: 'Pitch Your Seat: Eply',
      from: '"Marc Beenders" <m.beenders@lrm.be>',
      to: 'yelle@eply.be, "Bruno Vandenabeele" <bruno@wintercircus.be>, ines@thebeacon.eu, "Jan',
      date: '23 sep',
      time: '18:48',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0B1220] flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#3B82F6]" />
              Recente E-mail Activiteit
            </h1>
            <p className="text-gray-600 mt-2">
              Hier verschijnen je laatste e-mails en gegenereerde draft-replies
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-[#3B82F6] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Uitloggen
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="divide-y divide-gray-100">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-6 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[#0B1220] mb-2 truncate">
                      {email.subject}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Van:</span> {email.from}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">Naar:</span> {email.to}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {email.date}, {email.time}
                      </p>
                    </div>
                    <button className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-blue-50 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center gap-2 font-medium group-hover:border-[#3B82F6]">
                      AI Reply
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
