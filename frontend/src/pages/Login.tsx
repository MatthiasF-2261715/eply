import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("user: ", user);
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signIn();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sign in to Eply</h2>
          <p className="mt-2 text-gray-600">
            Connect your Gmail account to start automating your email responses
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <img
            className="h-5 w-5 mr-2"
            src="https://www.google.com/gmail/about/static/images/logo-gmail.png?cache=1adba63"
            alt="Gmail logo"
          />
          {loading ? 'Connecting...' : 'Continue with Gmail'}
        </button>
      </div>
    </div>
  );
}

export default Login;