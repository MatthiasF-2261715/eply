import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGmailApi } from '../hooks/useGmailApi';
import '../css/email-styles.css';

// Type definitions
interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  body?: string;
  to?: string;
}

function Dashboard() {
  // --- API HOOK ---
  const {
    emails,
    loading,
    loadingMore,
    loadingEmail,
    error,
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
    testTokenValidity,
    verifyUserToken 
  } = useGmailApi();

  // --- STATE MANAGEMENT ---
  const { user, signOut } = useAuth();
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [tokenError, setTokenError] = useState<boolean>(false);

  // Add a ref to track last email fetch time
  const lastFetchTime = useRef<number>(0);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // --- UTILITY FUNCTIONS ---

  // Decodes HTML entities in a string
  const decodeHTMLEntities = (text: string) => {
    if (!text) return '';
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Sanitizes email HTML content
  const sanitizeEmailHTML = (html: string) => {
    if (!html) return '';
    
    return html
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  };

  // Formats a date string to a user-friendly format
  const formatEmailDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        if (dateString.includes(',')) {
          const parts = dateString.split(',');
          if (parts.length >= 2) {
            const mainPart = parts[1].trim();
            const timeParts = mainPart.split(' ');
            if (timeParts.length >= 4) {
              const day = timeParts[0];
              const month = timeParts[1];
              const year = timeParts[2];
              const time = timeParts[3].split(':').slice(0, 2).join(':');
              return `${day} ${month} ${year} at ${time}`;
            }
          }
        }
        return dateString;
      }
      
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      
      return date.toLocaleDateString('en-US', options).replace(',', ' at');
    } catch (error) {
      return dateString;
    }
  };

  // --- EVENT HANDLERS ---
  
  // Handle view email with modal management
  const onViewEmail = async (emailId: string) => {
    setShowEmailModal(true);
    await handleViewEmail(emailId);
  };

  // Handle generate reply with modal management
  const onGenerateReply = async (emailId: string) => {
    await handleGenerateReply(emailId);
    setShowReplyModal(true);
  };

  // --- EFFECTS ---

  // Log authentication state when user changes
  useEffect(() => {
    if (user) {
      console.log("Auth state updated:", {
        hasToken: !!user.accessToken,
        hasProviderToken: !!user.userMetadata?.provider_token,
        provider: user.provider,
        email: user.email
      });
      
      const storedToken = localStorage.getItem('gmail_provider_token');
      console.log("Local storage token available:", !!storedToken);
    } else {
      console.log("No user object available");
    }
  }, [user]);
  
  // Load emails when component mounts with controlled frequency
  const loadEmails = useCallback(async (force = false) => {
    if (!user) return;
    
    const now = Date.now();
    // Only fetch if forced or it's been at least 2 minutes since last fetch
    if (!force && now - lastFetchTime.current < 120000 && emails.length > 0) {
      return;
    }
    
    try {
      let googleToken = user.userMetadata?.provider_token;
      
      if (!googleToken) {
        const storedToken = localStorage.getItem('gmail_provider_token');
        googleToken = storedToken || undefined;
      }
      
      if (!googleToken) {
        googleToken = user.accessToken;
        console.log("Using user accessToken as fallback for Gmail API");
      }
      
      if (!googleToken) {
        throw new Error("No valid Google access token found. Please re-login.");
      }
      
      const isValid = await testTokenValidity(googleToken);
      if (!isValid) {
        throw new Error("Google token is invalid or expired.");
      }

      await fetchEmails();
      lastFetchTime.current = now;
    } catch (error) {
      console.error("Error during email loading:", error);
      setTokenError(true);
    }
  }, [user, fetchEmails, testTokenValidity, emails.length]);

  // Initial email load with background validation
  useEffect(() => {
    let isMounted = true;
    
    // Set up initial load if emails are empty
    const initialLoadTimer = setTimeout(() => {
      if (isMounted && emails.length === 0) {
        loadEmails(true);
      }
    }, 2000);
    
    // Set up periodic token validation (once every 5 minutes) instead of constant refreshing
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }
    
    tokenCheckInterval.current = setInterval(() => {
      if (isMounted && user) {
        // Only verify token, don't auto-refresh
        verifyUserToken().catch(err => {
          console.error("Token validation error:", err);
          if (err.message?.includes("invalid")) {
            setTokenError(true);
          }
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      isMounted = false;
      clearTimeout(initialLoadTimer);
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, [loadEmails, emails.length, user, verifyUserToken]);
  
  // Handle token errors
  useEffect(() => {
    if (tokenError && user) {
      const timer = setTimeout(() => {
        signOut();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [tokenError, user, signOut]);

  // --- RENDER UI ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Email Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && emails.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : emails.length > 0 ? (
        // Email list display
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {emails.map((email) => (
              <li 
                key={email.id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewEmail(email.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">From: {email.from || "Unknown sender"}</p>
                    <p className="text-sm text-gray-500 truncate">{email.subject}</p>
                    <p className="text-sm text-gray-500">{decodeHTMLEntities(email.snippet)}</p>
                  </div>  
                  <div className="flex-shrink-0 text-sm text-gray-500">{formatEmailDate(email.date)}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateReply(email.id);
                    }}
                    disabled={generatingReply === email.id}
                    className={`ml-4 px-4 py-2 text-sm font-medium rounded-md ${
                      generatingReply === email.id 
                        ? 'bg-blue-400 text-white cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {generatingReply === email.id ? 'Generating...' : 'Generate Reply'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Pagination */}
          {emails.length > 0 && nextPageToken && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-700 mb-3">
                Showing <span className="font-medium">{totalEmailsLoaded}</span> emails
              </p>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  loadingMore 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Show More'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No emails found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No emails were found in your inbox.
          </p>
          <div className="mt-6">
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Refresh Inbox
            </button>
          </div>
        </div>
      )}

      {/* Email reply modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-medium">{replySubject}</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {generatedReply}
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email view modal */}
      {showEmailModal && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[70vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 flex justify-between items-center border-b p-4 bg-white z-30 shadow-md">
              <h3 className="text-lg font-bold truncate text-gray-900">{selectedEmail.subject}</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
            
            {/* Metadata */}
            <div className="sticky top-[72px] p-4 border-b bg-white z-20 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-gray-900">From: {selectedEmail.from}</p>
                <p className="text-sm font-medium text-gray-900 ml-2">{formatEmailDate(selectedEmail.date)}</p>
              </div>
              {selectedEmail.to && (
                <p className="text-sm font-bold mt-1 text-gray-900">To: {selectedEmail.to}</p>
              )}
            </div>
            
            {/* Email content */}
            <div className="relative flex-grow overflow-auto" style={{ contain: 'content' }}>
              <div className="p-6">
                {loadingEmail ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : selectedEmail.body ? (
                  <div className="email-container"> 
                    <div 
                      key={`email-content-${selectedEmail.id}`}
                      className="prose prose-sm max-w-none email-content"
                      style={{ 
                        isolation: 'isolate',
                        position: 'relative',
                        zIndex: 1
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeEmailHTML(selectedEmail.body) 
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Loading email content...</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 border-t p-4 flex justify-end space-x-4 bg-white z-20 shadow-md">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  onGenerateReply(selectedEmail.id);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Generate Reply
              </button>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;