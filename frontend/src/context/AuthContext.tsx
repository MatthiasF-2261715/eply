import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
    provider_token?: string; // Added provider_token
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refreshes the access token using the provided refresh token
   * @param {string} refreshToken - The refresh token used to obtain a new access token
   * @returns {Promise<string>} The new access token
   * @throws {Error} If the token refresh fails
   */
  const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:5001/auth/refresh', {
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

  /**
   * Completes the OAuth flow by exchanging the auth code for tokens
   * @param {string} authCode - The authorization code from OAuth provider
   * @param {string} redirectUri - The redirect URI used in the OAuth flow
   * @returns {Promise<string>} The access token
   * @throws {Error} If the code exchange fails
   */
  const completeOAuthFlow = async (authCode: string, redirectUri: string): Promise<string> => {
    try {
      const response = await fetch('http://localhost:5001/auth/token', {
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

  /**
   * Checks for an existing session and initializes the user state
   * Also handles OAuth redirects
   */
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

  /**
   * Sets up a listener for auth state changes
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, "Session provider token:", !!session?.provider_token);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            accessToken: session.access_token,
            provider: session.user.app_metadata.provider,
            userMetadata: {
              ...session.user.user_metadata,
              provider_token: session.provider_token || undefined // Ensure we store this properly
            }
          });
          
          // If we have a provider token, store it in localStorage as a backup
          if (session.provider_token) {
            localStorage.setItem('gmail_provider_token', session.provider_token);
          }
        } else {
          setUser(null);
          localStorage.removeItem('gmail_provider_token');
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Initiates the OAuth sign-in flow with Google
   * @returns {Promise<void>}
   * @throws {Error} If the sign-in process fails
   */
  const signIn = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose',
          redirectTo: `${window.location.origin}${window.location.pathname}`,
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

  /**
   * Signs out the user from all sessions and clears tokens
   * @returns {Promise<void>}
   * @throws {Error} If the sign-out process fails
   */
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      localStorage.removeItem('gmail_refresh_token');
      
      if (user?.accessToken) {
        try {
          await fetch('http://localhost:5001/auth/logout', {
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