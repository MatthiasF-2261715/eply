import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

// --- TYPE DEFINITIONS ---
interface User {
  id: string;
  email: string;
  accessToken?: string;
  provider?: string;
  userMetadata?: {
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    full_name?: string;
    iss?: string;
    name?: string;
    picture?: string;
    provider_id?: string;
    sub?: string;
    provider_token?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// --- CONTEXT CREATION ---
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- API FUNCTIONS ---
  
  // Refreshes the access token using the provided refresh token
  const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  // Completes the OAuth flow by exchanging the auth code for tokens
  const completeOAuthFlow = async (authCode: string, redirectUri: string): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange auth code for tokens');
      }

      const tokenData = await response.json();
      
      localStorage.setItem('gmail_refresh_token', tokenData.refresh_token);
      
      return tokenData.access_token;
    } catch (error) {
      console.error('Error completing OAuth flow:', error);
      throw error;
    }
  };

  // --- EFFECTS ---

  // Initialize user session and handle OAuth redirects
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            accessToken: session.access_token,
            provider: session.user.app_metadata.provider,
            userMetadata: session.user.user_metadata
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
    
    // Handle OAuth redirect
    const handleRedirect = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      if (hashParams.get('access_token') || queryParams.get('code')) {
        setIsLoading(true);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('OAuth redirect handling error:', error);
        }
        
        setIsLoading(false);
      }
    };
    
    handleRedirect();
  }, []);

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, "Session:", session);
        
        if (session?.user) {
          console.log("Provider token:", session.provider_token);
          console.log("Access token:", session.access_token);
          
          // Store provider token in localStorage
          if (session.provider_token) {
            localStorage.setItem('gmail_provider_token', session.provider_token);
          }
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            accessToken: session.access_token,
            provider: session.user.app_metadata.provider,
            userMetadata: {
              ...session.user.user_metadata,
              provider_token: session.provider_token || undefined
            }
          });
        } else {
          setUser(null);
          // Clear localStorage when user signs out
          localStorage.removeItem('gmail_provider_token');
        }
        setIsLoading(false);
      }
    );
  
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- AUTH ACTIONS ---
  
  // Initiates the OAuth sign-in flow with Google
  const signIn = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Use the correct deployed URL for production, or local URL for development
      const redirectUrl = import.meta.env.PROD 
        ? 'https://eply.onrender.com' 
        : window.location.origin;
        
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose',
          redirectTo: redirectUrl,
        },
      });
  
      if (error) throw error;
      
      if (!data.url) {
        throw new Error('No OAuth URL returned');
      }
  
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Signs out the user from all sessions and clears tokens
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      localStorage.removeItem('gmail_refresh_token');
      
      if (user?.accessToken) {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.accessToken}`
            }
          });
        } catch (err) {
          console.error("Error clearing server-side token cache:", err);
        }
      }
      
      localStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};