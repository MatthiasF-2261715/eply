import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';
const EMAILS_PER_REQUEST = 20;

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  body?: string;
  to?: string;
}

interface WritingStyleAnalysis {
  greeting_patterns: string[];
  closing_patterns: string[];
  formality_level: string;
  common_phrases: string[];
  sample_count: number;
}

interface ApiResponse {
  emails: Email[];
  loading: boolean;
  loadingMore: boolean;
  loadingEmail: boolean;
  error: string | null;
  tokenError: boolean;
  nextPageToken: string | null;
  totalEmailsLoaded: number;
  styleAnalysis: WritingStyleAnalysis | null;
  selectedEmail: Email | null;
  generatedReply: string;
  generatingReply: string | null;
  replySubject: string;
  fetchEmails: (overrideToken?: string, isLoadingMore?: boolean) => Promise<void>;
  handleGenerateReply: (emailId: string) => Promise<void>;
  handleViewEmail: (emailId: string) => Promise<void>;
  handleLoadMore: () => void;
  handleRefresh: () => void;
  verifyUserToken: () => Promise<boolean>;
  testTokenValidity: (token: string) => Promise<boolean>;
  cleanSnippet: (snippet: string) => string;
}

export function useGmailApi(companyId: string = "default-company"): ApiResponse {
  // State management for emails and UI
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<boolean>(false);
  const [styleAnalysis, setStyleAnalysis] = useState<WritingStyleAnalysis | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);

  // Pagination state
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalEmailsLoaded, setTotalEmailsLoaded] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { user, signOut } = useAuth();

  // Add a ref to track the last token verification time
  const lastVerification = useRef<{ token: string; timestamp: number; isValid: boolean } | null>(null);

  // Cleans up email snippet text
  const cleanSnippet = (snippet: string): string => {
    if (!snippet) return '';
    
    const parser = new DOMParser();
    let cleaned = parser.parseFromString(snippet, 'text/html').documentElement.textContent || '';
    cleaned = cleaned.replace(/&#\d+;/g, '').replace(/&[a-zA-Z]+;/g, '');
    
    return cleaned;
  };

  // Verifies if the user's token is valid with caching
  const verifyUserToken = async (): Promise<boolean> => {
    if (!user || !user.accessToken) {
      return false;
    }

    // Use cached result if verified in the last 5 minutes
    const now = Date.now();
    if (lastVerification.current && 
        lastVerification.current.token === user.accessToken && 
        now - lastVerification.current.timestamp < 5 * 60 * 1000) {
      return lastVerification.current.isValid;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      const isValid = response.ok;

      // Cache the verification result
      lastVerification.current = {
        token: user.accessToken,
        timestamp: now,
        isValid
      };

      return isValid;
    } catch (error) {
      console.error('Error verifying user token:', error);
      return false;
    }
  };

  // Tests token validity
  const testTokenValidity = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.valid === true;
    } catch (e) {
      return false;
    }
  };

  // Fetches emails from the backend
  const fetchEmails = async (overrideToken?: string, isLoadingMore: boolean = false): Promise<void> => {
    if (!isLoadingMore) {
      setEmails([]);
      setTotalEmailsLoaded(0);
    }
    
    isLoadingMore ? setLoadingMore(true) : setLoading(true);
    setError(null);
    setTokenError(false);
  
    if (!user) {
      setError("Not logged in");
      setLoading(false);
      setLoadingMore(false);
      return;
    }
  
    try {
      let googleToken = overrideToken;
      
      if (!googleToken) {
        googleToken = user.userMetadata?.provider_token;
        
        if (!googleToken) {
          const storedToken = localStorage.getItem('gmail_provider_token');
          googleToken = storedToken || undefined;
        }
        
        if (!googleToken) {
          googleToken = user.accessToken;
          console.log("Using user accessToken as fallback for Gmail API");
        }
      }
      
      if (!googleToken) {
        setError("No valid Google access token found. Please re-login.");
        setLoading(false);
        setLoadingMore(false);
        return;
      }
  
      console.log("Using token for Gmail API access", { tokenExists: !!googleToken });
      
      const url = new URL(`${API_URL}/get-emails`);
      url.searchParams.append('maxResults', EMAILS_PER_REQUEST.toString());
      
      if (isLoadingMore && nextPageToken) {
        url.searchParams.append('pageToken', nextPageToken);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setTokenError(true);
          throw new Error("Your Gmail access has expired. Please login again.");
        }
        throw new Error(`Failed to fetch emails: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      setNextPageToken(data.nextPageToken || null);
      
      if (Array.isArray(data.emails)) {
        if (isLoadingMore) {
          setEmails(prevEmails => [...prevEmails, ...data.emails.map((email: any) => ({
            ...email,
            snippet: cleanSnippet(email.snippet || '')
          }))]);
          setTotalEmailsLoaded(prev => prev + data.emails.length);
        } else {
          setEmails(data.emails.map((email: any) => ({
            ...email,
            snippet: cleanSnippet(email.snippet || '')
          })));
          setTotalEmailsLoaded(data.emails.length);
        }
      } else {
        console.warn("API returned unexpected data structure:", data);
        if (!isLoadingMore) {
          setEmails([]);
          setTotalEmailsLoaded(0);
        }
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error instanceof Error ? error.message : String(error));
      
      if (tokenError) {
        console.log("Initiating automatic logout due to invalid Gmail credentials");
        setTimeout(() => {
          if (signOut) signOut();
        }, 2000);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Generates an AI reply to an email
  const handleGenerateReply = async (emailId: string): Promise<void> => {
    if (!user) {
      setError("Not logged in");
      return;
    }
  
    setGeneratingReply(emailId);
  
    try {
      const googleToken = user.userMetadata?.provider_token;
      
      if (!googleToken) {
        throw new Error("No valid Google access token found. Please re-login.");
      }

      console.log("Using provider token for reply generation:", !!googleToken);
      
      const response = await fetch(`${API_URL}/generate-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleToken}`,
        },
        body: JSON.stringify({ emailId, companyId }),
      });
  
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setTokenError(true);
          throw new Error("Your Gmail access has expired. Please login again.");
        }
        
        const errorText = await response.text();
        console.error("API error response for reply generation:", errorText);
        throw new Error(`Failed to generate reply: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      const emailBeingReplied = emails.find(email => email.id === emailId);
      const subject = emailBeingReplied ? `Re: ${emailBeingReplied.subject}` : 'Reply';
  
      setGeneratedReply(result.reply);
      setReplySubject(subject);
      
      if (result.styleAnalysis) {
        setStyleAnalysis(result.styleAnalysis);
      }
    } catch (error) {
      console.error('Error generating reply:', error);
      setError(error instanceof Error ? error.message : String(error));
      
      if (tokenError) {
        setTimeout(() => {
          if (signOut) signOut();
        }, 2000);
      }
    } finally {
      setGeneratingReply(null);
    }
  };

  // Refresh the email list
  const handleRefresh = (): void => {
    setEmails([]);
    setError(null);
    setNextPageToken(null);
    setTotalEmailsLoaded(0);
    fetchEmails();
  };

  // Fetches and displays a specific email
  const handleViewEmail = async (emailId: string): Promise<void> => {
    if (!user) {
      setError("Not logged in");
      return;
    }
  
    setSelectedEmail(null);
    setLoadingEmail(true);
    
    try {
      const emailInList = emails.find(email => email.id === emailId);
      if (!emailInList) {
        throw new Error("Email not found");
      }
      
      setSelectedEmail({...emailInList, body: undefined});
      
      let googleToken = user.userMetadata?.provider_token;
      
      if (!googleToken) {
        const storedToken = localStorage.getItem('gmail_provider_token');
        googleToken = storedToken || undefined;
      }
      
      if (!googleToken) {
        googleToken = user.accessToken;
      }
      
      if (!googleToken) {
        throw new Error("No valid Google access token found. Please re-login.");
      }
      
      const url = new URL(`${API_URL}/get-email-detail`);
      url.searchParams.append('id', emailId);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setTokenError(true);
          throw new Error("Your Gmail access has expired. Please login again.");
        }
        throw new Error(`Failed to fetch email: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      if (!data.email || !data.email.body) {
        throw new Error("Unexpected response format from server");
      }
      
      const updatedEmails = emails.map(email => 
        email.id === emailId 
          ? { ...email, body: data.email.body } 
          : email
      );
      
      setEmails(updatedEmails);
      setSelectedEmail({ ...emailInList, body: data.email.body });
    } catch (error) {
      console.error('Error fetching email:', error);
      setError(error instanceof Error ? error.message : String(error));
      
      if (tokenError) {
        setTimeout(() => {
          if (signOut) signOut();
        }, 2000);
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  // Loads more emails
  const handleLoadMore = (): void => {
    if (nextPageToken) {
      fetchEmails(undefined, true);
    }
  };

  return {
    emails,
    loading,
    loadingMore,
    loadingEmail,
    error,
    tokenError,
    nextPageToken,
    totalEmailsLoaded,
    styleAnalysis,
    selectedEmail,
    generatedReply,
    generatingReply,
    replySubject,
    fetchEmails,
    handleGenerateReply,
    handleViewEmail,
    handleLoadMore,
    handleRefresh,
    verifyUserToken,
    testTokenValidity,
    cleanSnippet
  };
}