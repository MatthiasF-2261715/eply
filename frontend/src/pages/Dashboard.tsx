import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../css/email-styles.css';

const API_URL = import.meta.env.VITE_API_URL || '';

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

function Dashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [generatedReply, setGeneratedReply] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [generatingReply, setGeneratingReply] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<WritingStyleAnalysis | null>(null);
  const companyId = "default-company";

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const emailsPerPage = 20; // Number of emails to display per page

  /**
   * Verifies if the user's token is valid and belongs to the current user
   * @returns {Promise<boolean>} True if token is valid, false otherwise
   */
  const verifyUserToken = async (): Promise<boolean> => {
    if (!user || !user.accessToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const data = await response.json();
      
      if (data.email && user.email && data.email !== user.email) {
        console.error(`Token belongs to ${data.email} but current user is ${user.email}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  };

  /**
   * Formats a date string to a user-friendly format without seconds, timezone, etc.
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date string
   */
  const formatEmailDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      
      // Parse the date string to a Date object
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Try to handle common email date formats
        if (dateString.includes(',')) {
          // Format like: "Sun, 04 May 2025 09:26:37 +0000 (UTC)"
          const parts = dateString.split(',');
          if (parts.length >= 2) {
            // Remove everything after the time (timezone, etc.)
            const mainPart = parts[1].trim();
            const timeParts = mainPart.split(' ');
            if (timeParts.length >= 4) {
              // Just keep day, month, year, and time without seconds
              const day = timeParts[0];
              const month = timeParts[1];
              const year = timeParts[2];
              const time = timeParts[3].split(':').slice(0, 2).join(':');
              return `${day} ${month} ${year} at ${time}`;
            }
          }
        }
        return dateString; // Return original if we can't parse it
      }
      
      // Format date for display: "4 May 2025 at 09:26"
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
      console.error('Error formatting date:', error);
      return dateString; // Return original if there's an error
    }
  };

  /**
   * Fetches emails from the backend server
   * @param {string} [overrideToken] - Optional token to use instead of looking up tokens
   * @param {number} [page] - Page number to fetch
   * @param {string | null} [nextPageToken] - Token for the next page
   * @returns {Promise<void>}
   */
  async function fetchEmails(overrideToken?: string, page: number = 1, nextPageToken?: string | null): Promise<void> {
    // Don't reset emails if we're loading a page other than the first one
    if (page === 1) {
      setEmails([]);
    }
    
    setLoading(true);
    setError(null);
  
    if (!user) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
  
    try {
      // Use provided override token or get one from available sources
      let googleToken = overrideToken;
      
      if (!googleToken) {
        // Get the Google access token from Supabase user metadata or localStorage
        googleToken = user.userMetadata?.provider_token;
        
        // Fallback to localStorage if not available in metadata
        if (!googleToken) {
          const storedToken = localStorage.getItem('gmail_provider_token');
          googleToken = storedToken || undefined; // Convert null to undefined
        }
        
        if (!googleToken) {
          // Try to get the token from the user's accessToken
          googleToken = user.accessToken;
          console.log("Using user accessToken as fallback for Gmail API");
        }
      }
      
      if (!googleToken) {
        setError("No valid Google access token found. Please re-login.");
        setLoading(false);
        return;
      }
  
      console.log("Using token for Gmail API access", { tokenExists: !!googleToken });
      
      // Create URL with query parameters for pagination
      const url = new URL(`${API_URL}/get-emails`);
      url.searchParams.append('maxResults', emailsPerPage.toString());
      
      // Add pageToken if we're not on the first page
      if (nextPageToken) {
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
        throw new Error(`Failed to fetch emails: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      // Check if we have a next page token in the response
      const newPageToken = data.nextPageToken || null;
      setPageToken(newPageToken);
      setHasMoreEmails(!!newPageToken);
      
      if (Array.isArray(data.emails)) {
        // If we're on a page > 1, append to existing emails instead of replacing
        if (page > 1) {
          setEmails(prevEmails => [...prevEmails, ...data.emails]);
        } else {
          setEmails(data.emails);
        }
      } else {
        console.warn("API returned unexpected data structure:", data);
        setEmails([]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Generates an AI reply to a specific email
   * @param {string} emailId - The ID of the email to generate a reply for
   * @returns {Promise<void>}
   */
  const handleGenerateReply = async (emailId: string): Promise<void> => {
    if (!user) {
      setError("Not logged in");
      return;
    }
  
    setGeneratingReply(emailId);
  
    try {
      const googleToken = user.userMetadata?.provider_token; // Get Google token from user metadata
      
      if (!googleToken) {
        throw new Error("No valid Google access token found. Please re-login.");
      }

      // Debug log to check token
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
      
      setShowReplyModal(true);
    } catch (error) {
      console.error('Error generating reply:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setGeneratingReply(null);
    }
  };

  /**
   * Refreshes the email list
   * @returns {void}
   */
  const handleRefresh = (): void => {
    setEmails([]);
    setError(null);
    setCurrentPage(1);
    setPageToken(null);
    fetchEmails(undefined, 1, null);
  };

  /**
   * Fetches and displays the full content of a specific email
   * @param {string} emailId - The ID of the email to view
   * @returns {Promise<void>}
   */
  const handleViewEmail = async (emailId: string): Promise<void> => {
    if (!user) {
      setError("Not logged in");
      return;
    }
  
    setSelectedEmail(null);
    setShowEmailModal(true);
    setLoadingEmail(true);
    
    try {
      const emailInList = emails.find(email => email.id === emailId);
      if (!emailInList) {
        throw new Error("Email not found");
      }
      
      setSelectedEmail({...emailInList, body: undefined});
      
      // Get token for authorization
      let googleToken = user.userMetadata?.provider_token;
      
      // Fallback to localStorage if not available in metadata
      if (!googleToken) {
        const storedToken = localStorage.getItem('gmail_provider_token');
        googleToken = storedToken || undefined;
      }
      
      // Last resort fallback
      if (!googleToken) {
        googleToken = user.accessToken;
      }
      
      if (!googleToken) {
        throw new Error("No valid Google access token found. Please re-login.");
      }
      
      // Create URL with query parameter for the email ID
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
        // Alleen de status en statusText gebruiken voor de error
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
    } finally {
      setLoadingEmail(false);
    }
  };

  /**
   * Handles page changes for pagination
   * @param {number} newPage - The new page number
   */
  const handlePageChange = (newPage: number): void => {
    if (newPage === currentPage) return;
    
    setCurrentPage(newPage);
    
    if (newPage > currentPage) {
      // We're going forward, use the pageToken
      fetchEmails(undefined, newPage, pageToken);
    } else {
      // We're going backward, need to reset and fetch from start
      // Note: Gmail API doesn't support backward pagination easily
      // So we'll restart from page 1 and load up to the requested page
      let token: string | null = null;
      setCurrentPage(1);
      
      // This is a simple approach - ideally we'd cache previous page tokens
      const loadPages = async () => {
        for (let i = 1; i <= newPage; i++) {
          await fetchEmails(undefined, i, token);
          token = pageToken;
          setCurrentPage(i);
        }
      };
      
      loadPages();
    }
  };

  /**
   * Loads emails when component mounts or when user changes
   */
  useEffect(() => {
    if (user) {
      console.log("Auth state updated:", {
        hasToken: !!user.accessToken,
        hasProviderToken: !!user.userMetadata?.provider_token,
        provider: user.provider,
        email: user.email
      });
      
      // Check localStorage for tokens
      const storedToken = localStorage.getItem('gmail_provider_token');
      console.log("Local storage token available:", !!storedToken);
    } else {
      console.log("No user object available");
    }
  }, [user]);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadEmails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      if (isMounted) {
        setLoading(true);
        try {
          // Give more time for token to be fully available
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Get the Google access token from Supabase user metadata or localStorage
          let googleToken = user.userMetadata?.provider_token;
          
          // Fallback to localStorage if not available in metadata
          if (!googleToken) {
            const storedToken = localStorage.getItem('gmail_provider_token');
            googleToken = storedToken || undefined; // Convert null to undefined
          }
          
          if (!googleToken) {
            // Try to get the token from the user's accessToken
            googleToken = user.accessToken;
            console.log("Using user accessToken as fallback for Gmail API");
          }
          
          if (!googleToken) {
            throw new Error("No valid Google access token found. Please re-login.");
          }
          
          // Test if token is valid before proceeding
          const isValid = await testTokenValidity(googleToken);
          if (!isValid) {
            throw new Error("Google token is invalid or expired.");
          }
  
          // Proceed with fetching emails using the valid token
          if (isMounted) {
            await fetchEmails();
          }
        } catch (error) {
          console.error("Error during initial email loading:", error);
          if (isMounted) {
            setError("Failed to load emails. Please try refreshing.");
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };
  
    // Add a helper function to test token validity
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
    
    // Run the email loading logic with a longer delay to ensure auth is complete
    const timer = setTimeout(() => {
      loadEmails();
    }, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {loading && currentPage === 1 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : emails.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {emails.map((email) => (
              <li 
                key={email.id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewEmail(email.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">From: {email.from || "Unknown sender"}</p>
                    <p className="text-sm text-gray-500 truncate">{email.subject}</p>
                    <p className="text-sm text-gray-500">{email.snippet}</p>
                  </div>  
                  <div className="flex-shrink-0 text-sm text-gray-500">{formatEmailDate(email.date)}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReply(email.id);
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
          
          {/* Pagination UI */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasMoreEmails || loading}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  !hasMoreEmails || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{emails.length > 0 ? (currentPage - 1) * emailsPerPage + 1 : 0}</span> to{' '}
                  <span className="font-medium">{(currentPage - 1) * emailsPerPage + emails.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {currentPage}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasMoreEmails || loading}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      !hasMoreEmails || loading 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
          
          {/* Loading indicator for pagination */}
          {loading && currentPage > 1 && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading more emails...</span>
            </div>
          )}
        </div>
      ) : (
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[70vh] flex flex-col">
            {/* Fixed header with higher z-index and strong visibility */}
            <div className="flex justify-between items-center border-b p-4 bg-white z-20 relative">
              <h3 className="text-lg font-medium truncate text-gray-900">{selectedEmail.subject}</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            
            {/* Fixed metadata section with higher z-index */}
            <div className="p-4 border-b bg-white z-10 relative">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">From: {selectedEmail.from}</p>
                <p className="text-sm text-gray-500">{formatEmailDate(selectedEmail.date)}</p>
              </div>
              {selectedEmail.to && (
                <p className="text-sm font-medium mt-1 text-gray-900">To: {selectedEmail.to}</p>
              )}
            </div>
            
            {/* Content wrapper with isolation to prevent styles from leaking */}
            <div className="relative p-6 overflow-y-auto flex-grow z-0 isolate">
              {loadingEmail ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedEmail.body ? (
                <div className="email-container relative"> 
                  {/* Add a style reset to prevent external styles from affecting our container */}
                  <div 
                    key={`email-content-${selectedEmail.id}`}
                    className="prose prose-sm max-w-none email-content"
                    style={{ isolation: 'isolate' }} // Add CSS isolation
                    dangerouslySetInnerHTML={{ 
                      __html: selectedEmail.body 
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Loading email content...</p>
                </div>
              )}
            </div>
            
            {/* Fixed footer with z-index */}
            <div className="border-t p-4 flex justify-end space-x-4 bg-white z-10 relative">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  handleGenerateReply(selectedEmail.id);
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