import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Mail, LogOut } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function NavBar() {
  const { user, signOut, isLoading } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Mail className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">EmailAI</span>
        </div>
        <nav className="flex items-center space-x-8">
          <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
          {user && <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>}
          {user ? (
            <button 
              onClick={handleSignOut}
              disabled={isLoading}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout {user.email ? `(${user.email.split('@')[0]})` : ''}
            </button>
          ) : (
            <a href="/login" className="text-gray-600 hover:text-gray-900">Login</a>
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          <NavBar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;