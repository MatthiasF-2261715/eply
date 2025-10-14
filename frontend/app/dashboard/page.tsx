'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User, Settings, BarChart3, PlusCircle } from 'lucide-react';

interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
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
    { id: 'Statistieken', label: 'Statistieken', icon: BarChart3 },
    { id: 'mail', label: 'E-mail', icon: Mail },
    { id: 'account', label: 'Account', icon: User },
    { id: 'settings', label: 'Instellingen', icon: Settings },
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
              className="mt-3 w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 px-3 rounded-md hover:bg-red-50 transition-colors"
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
          {activeNav === 'account' ? (
            <AccountContent profile={profile} />
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