'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User, Settings, BarChart3, PlusCircle, Loader2 } from 'lucide-react';

interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
}

interface EmailFormData {
  server: string;
  port: number;
  email: string;
  password: string;
}

const AccountContent = ({ profile }: { profile: UserProfile | null }) => {
  if (!profile) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Account Informatie</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Voornaam</label>
          <p className="mt-1 text-gray-900">{profile.firstName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Achternaam</label>
          <p className="mt-1 text-gray-900">{profile.lastName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">E-mail</label>
          <p className="mt-1 text-gray-900">{profile.email}</p>
        </div>
      </div>
    </div>
  );
};

const StatisticsContent = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <BarChart3 className="w-full h-full text-blue-500 animate-pulse" />
          <div className="absolute -top-2 -right-2">
            <div className="relative">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
              <div className="absolute top-0 w-4 h-4 bg-yellow-500 rounded-full" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Statistieken</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          We zijn bezig met het ontwikkelen van geavanceerde statistieken om je inzicht te geven in je e-mail prestaties.
        </p>
        <div className="flex flex-col items-center space-y-2">
          <span className="text-blue-600 font-medium">Binnenkort beschikbaar</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<EmailFormData>({
    server: '',
    port: 993,
    email: '',
    password: ''
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/imap/get_linked_emails`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setEmails(data.emails);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/imap/link_email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to add email');
      
      setIsOpen(false);
      fetchEmails(); // Refresh email list
      
      // Reset form
      setFormData({
        server: '',
        port: 993,
        email: '',
        password: ''
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email List Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Gekoppelde E-mailadressen</h2>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nieuw e-mailadres
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : emails.length > 0 ? (
          <div className="grid gap-4">
            {emails.map((email, index) => (
              <div
                key={index}
                className="flex items-center p-4 bg-gray-50 rounded-lg"
              >
                <Mail className="w-5 h-5 text-blue-600 mr-3" />
                <span>{email}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nog geen e-mailadressen gekoppeld
          </div>
        )}
      </div>

      {/* Add Email Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    E-mailadres Toevoegen
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">E-mailadres</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IMAP Server</label>
                      <input
                        type="text"
                        value={formData.server}
                        onChange={(e) => setFormData({...formData, server: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Port</label>
                      <input
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Wachtwoord</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        Annuleren
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        Toevoegen
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/users/profile`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        router.push('/');
      }
    };

    fetchProfile();
  }, [BACKEND_URL, router]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'mail', label: 'E-mail', icon: Mail },
    { id: 'settings', label: 'Instellingen', icon: Settings },
    { id: 'statistieken', label: 'Statistieken', icon: BarChart3 },
    { id: 'template', label: 'Nieuw Item', icon: PlusCircle },
  ];

  const handleNavClick = (navId: string) => {
    setActiveNav(navId);
    // Here you can add navigation logic for each item
    // Example: router.push(`/dashboard/${navId}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 px-3 py-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold px-4">Dashboard</h2>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  activeNav === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {profile && (
          <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {profile.firstName?.[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-gray-600 hover:text-red-600 hover:bg-red-50 py-2 px-3 rounded-full transition-colors text-sm font-medium"
            >
              Uitloggen
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 p-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {navigationItems.find((item) => item.id === activeNav)?.label}
          </h1>
          
          {/* Conditional rendering based on active navigation */}
          {activeNav === 'mail' ? (
            <EmailContent />
          ) : activeNav === 'account' ? (
            <AccountContent profile={profile} />
          ) : activeNav === 'statistieken' ? (
            <StatisticsContent />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">
                Dit is de {navigationItems.find((item) => item.id === activeNav)?.label} pagina.
                Voeg hier je specifieke content toe.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}