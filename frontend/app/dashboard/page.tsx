'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Settings, BarChart3, Clock, Users, ArrowRight, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [emailsError, setEmailsError] = useState<string | null>(null);
  const [showReplyPopup, setShowReplyPopup] = useState(false);
  const [currentReply, setCurrentReply] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const isInitialLoad = useRef(true);
  const [processedEmailIds, setProcessedEmailIds] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [whitelistDone, setWhitelistDone] = useState(false);
  const [profileDone, setProfileDone] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    let isMounted = true;
    fetch(`${BACKEND_URL}/users/isWhitelisted`, {
      credentials: 'include',
      method: 'GET',
    })
      .then(async res => {
        if (!res.ok || res.redirected) {
          const target = `${BACKEND_URL}/auth/signoutContact`;
            try {
              window.location.replace(target);
            } catch {
              router.replace(target);
            }
        } 
      })
      .catch(() => {
        const target = `${BACKEND_URL}/auth/signoutContact`;
        try {
          window.location.replace(target);
        } catch {
          router.replace(target);
        }
      })
      .finally(() => {
        if (isMounted) setWhitelistDone(true);
      });
    return () => { isMounted = false; };
  }, [BACKEND_URL, router]);

  useEffect(() => {
    let isMounted = true;
    fetch(`${BACKEND_URL}/users/profile`, {
      credentials: 'include',
    })
      .then(async res => {
        if (!res.ok || res.redirected) {
          router.replace('/');
        } else {
          const data = await res.json();
          if (isMounted) setUsername(data.username);
        }
      })
      .catch(() => {
        router.replace('/');
      })
      .finally(() => {
        if (isMounted) setProfileDone(true);
      });
    return () => { isMounted = false; };
  }, [BACKEND_URL, router]);

  useEffect(() => {
    if (whitelistDone && profileDone) {
      setLoading(false);
    }
  }, [whitelistDone, profileDone]);

  const handleGenerateReply = async (emailToReply = null) => {
    const targetEmail = emailToReply || (emails.length ? emails[0] : null);
    
    if (!targetEmail) return;

    const emailId = targetEmail.id || targetEmail.subject;

    setLoadingReplies(prev => new Set(prev).add(emailId));


    // Handle different email formats (IMAP vs Outlook)
    const emailAddress = targetEmail.from?.emailAddress?.address || targetEmail.from;
    const title = targetEmail.subject;
    const content = targetEmail.body?.content || targetEmail.text || targetEmail.content;
    const originalMailId = targetEmail.id || '';

    if (!emailAddress || !title || !content) {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
      return;
    }

    try {      
      const response = await fetch(`${BACKEND_URL}/users/ai/reply`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailAddress,
          title: title,
          content: content,
          originalMailId: originalMailId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await response.json();

      if (data.skip) {
        return;
      }
      
      setCurrentReply(data.response || 'Geen antwoord ontvangen');
      setShowReplyPopup(true);
    } catch (err) {
      console.error('AI Reply Error:', err);
      setCurrentReply(`Fout bij AI reply ophalen: ${err}`);
      setShowReplyPopup(true);
    } finally {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchEmails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/users/mails`, {
          credentials: 'include',
        });

        if (!res.ok || res.redirected) {
          setEmailsError('Niet ingelogd of sessie verlopen.');
          setEmails([]);
        } else {
          const data = await res.json();
          const newEmails = Array.isArray(data) ? data : data.mails || [];
          setEmails(newEmails);

          if (newEmails.length > 0) {
            const latestEmail = newEmails[0];
            const emailTime = new Date(latestEmail.date).getTime();
            
            // Only generate reply if email is newer than last check AND not processed before
            if (!isInitialLoad.current && 
                emailTime > lastCheckTime && 
                !processedEmailIds.has(latestEmail.id)) {
              await handleGenerateReply(latestEmail);
              // Add email ID to processed set
              setProcessedEmailIds(prev => new Set(prev).add(latestEmail.id));
            }
            
            if (isInitialLoad.current) {
              isInitialLoad.current = false;
            }
            
            setLastCheckTime(Date.now());
          }
        }
      } catch (error) {
        setEmailsError('Fout bij ophalen van e-mails.');
        setEmails([]);
      } 
    };

    fetchEmails();
    intervalId = setInterval(fetchEmails, 60000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [processedEmailIds]);

  const ReplyPopup = () => {
    if (!showReplyPopup) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
          <h3 className="text-lg font-bold mb-4">AI Gegenereerd Antwoord</h3>
          <div className="bg-gray-50 p-4 rounded mb-4 whitespace-pre-wrap">
            {currentReply}
          </div>
          <Button 
            onClick={() => setShowReplyPopup(false)}
            className="w-full"
          >
            Sluiten
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">Laden...</span>
      </div>
    );
  }

  // Simplified, cleaner UI but keep all logic intact
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#3B82F6]" />
              Recente E-mail Activiteit
            </h1>
            <p className="text-gray-600 mt-2">
              {username ? `Hallo ${username}! Hier verschijnen je laatste e-mails en draft-replies.` : 'Hier verschijnen je laatste e-mails en draft-replies.'}
            </p>
          </div>
          <button
            onClick={() => window.location.href = `${BACKEND_URL}/auth/signout`}
            className="flex items-center gap-2 text-gray-600 hover:text-[#3B82F6] transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Uitloggen
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="divide-y divide-gray-100">
            {emails.length === 0 && !emailsError && (
              <div className="p-6 text-gray-500">Geen e-mails gevonden.</div>
            )}

            {emailsError && (
              <div className="p-6 text-red-500">{emailsError}</div>
            )}

            {emails.map((email, index) => {
              const subject = email.subject || '(Geen onderwerp)';
              const from = email.from?.emailAddress?.address || email.from || 'Onbekend';
              const to = email.to?.emailAddress?.address || email.to || '';
              const dateObj = email.date ? new Date(email.date) : null;
              const date = dateObj ? dateObj.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '';
              const time = dateObj ? dateObj.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : '';
              const emailKey = `${email.id || index}-${subject}`;

              return (
                <div key={emailKey} className="p-6 hover:bg-blue-50/50 transition-colors group">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-2">{subject}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600"><span className="font-medium">Van:</span> {from}</p>
                        <p className="text-sm text-gray-600 truncate"><span className="font-medium">Naar:</span> {to}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{date}{time ? `, ${time}` : ''}</p>
                      </div>
                      <button
                        onClick={() => handleGenerateReply(email)}
                        disabled={loadingReplies.has(email.id || email.subject)}
                        className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-blue-50 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center gap-2 font-medium group-hover:border-[#3B82F6] disabled:opacity-60"
                      >
                        {loadingReplies.has(email.id || email.subject) ? 'Laden...' : 'AI Reply'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ReplyPopup />
    </div>
  );
}