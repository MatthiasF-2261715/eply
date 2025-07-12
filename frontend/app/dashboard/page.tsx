'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Settings, BarChart3, Clock, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [emailsError, setEmailsError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:4000/users/profile', {
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok  || res.redirected) {
          router.replace('/');
        } else {
          const data = await res.json();
          setUsername(data.username);
          setLoading(false);
        }
      })
      .catch(() => {
        router.replace('/');
      });
  }, [router]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchEmails = () => {
      setEmailsLoading(true);
      fetch('http://localhost:4000/users/mails', {
        credentials: 'include',
      })
        .then(async res => {
          if (!res.ok || res.redirected) {
            setEmailsError('Niet ingelogd of sessie verlopen.');
            setEmails([]);
          } else {
            const data = await res.json();
            setEmails(Array.isArray(data) ? data : data.mails || []);
          }
          setEmailsLoading(false);
        })
        .catch(() => {
          setEmailsError('Fout bij ophalen van e-mails.');
          setEmails([]);
          setEmailsLoading(false);
        });
    };

    fetchEmails(); // initial fetch
    intervalId = setInterval(fetchEmails, 10000); // elke 10 seconden

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">Laden...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welkom bij je Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                {username ? `Hallo ${username}! Hier komen later je e-mails en draft-functies.` : 'Hallo Gebruiker! Hier komen later je e-mails en draft-functies.'}
              </p>
            </div>
            <Button
              variant="outline"
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              onClick={() => window.location.href = 'http://localhost:4000/auth/signout'}
            >
              Uitloggen
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: 'Totaal E-mails',
              value: '1,234',
              icon: <Mail className="w-6 h-6 text-blue-600" />,
              change: '+12%',
              changeType: 'positive'
            },
            {
              title: 'Draft Replies',
              value: '56',
              icon: <BarChart3 className="w-6 h-6 text-green-600" />,
              change: '+8%',
              changeType: 'positive'
            },
            {
              title: 'Besparde Tijd',
              value: '24h',
              icon: <Clock className="w-6 h-6 text-purple-600" />,
              change: '+15%',
              changeType: 'positive'
            },
            {
              title: 'Contacten',
              value: '89',
              icon: <Users className="w-6 h-6 text-orange-600" />,
              change: '+3%',
              changeType: 'positive'
            }
          ].map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-green-600">
                  {stat.change} vanaf vorige maand
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Recente E-mail Activiteit
                </CardTitle>
                <CardDescription>
                  Hier verschijnen je laatste e-mails en gegenereerde draft-replies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 relative">
                  {emailsError ? (
                    <div className="text-red-500">{emailsError}</div>
                  ) : emails.length === 0 ? (
                    <div className="text-gray-500">Geen e-mails gevonden.</div>
                  ) : (
                    emails.map((email, index) => {
                      const subject = email.subject || '(Geen onderwerp)';
                      const from = email.from || 'Onbekend';
                      const to = email.to || '';
                      const date = email.date
                        ? new Date(email.date).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                        : '';
                      return (
                        <div key={email.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{subject}</p>
                            <p className="text-sm text-gray-600">Van: {from}</p>
                            {to && <p className="text-xs text-gray-500">Naar: {to}</p>}
                            {email.snippet && <p className="text-xs text-gray-400 mt-1">{email.snippet}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{date}</p>
                            <Button size="sm" variant="ghost" className="mt-1">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Snelle Acties
                </CardTitle>
                <CardDescription>
                  Beheer je AI-instellingen en voorkeuren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  E-mails Synchroniseren
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  AI Instellingen
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistieken Bekijken
                </Button>
              </CardContent>
            </Card>

            {/* TODO Items */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Komende Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Outlook email fetch implementeren</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">AI draft-reply generatie</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Real-time notificaties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">Geavanceerde filters</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}