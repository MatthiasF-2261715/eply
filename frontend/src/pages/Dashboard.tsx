import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../css/email-styles.css';

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

  /**
   * Verifies if the user's token is valid and belongs to the current user
   * @returns {Promise<boolean>} True if token is valid, false otherwise
   */
  const verifyUserToken = async (): Promise<boolean> => {
    if (!user || !user.accessToken) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:5001/auth/verify-token', {
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
   * Fetches emails from the backend server
   * @returns {Promise<void>}
   */
  /**
 * Fetches emails from the backend server
 * @param {string} [overrideToken] - Optional token to use instead of looking up tokens
 * @returns {Promise<void>}
 */
  async function fetchEmails(overrideToken?: string): Promise<void> {
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
      
      const response = await fetch('http://localhost:5001/get-emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // More detailed error handling
        try {
          const errorData = await response.json();
          throw new Error(`Failed to fetch emails: ${errorData.error || response.status}`);
        } catch (jsonError) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch emails: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      if (Array.isArray(data.emails)) {
        setEmails(data.emails);
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
      
      const response = await fetch('http://localhost:5001/generate-reply', {
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
    fetchEmails();
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
      // Change from 'emailId' to 'id' to match Flask server's expectation
      const url = new URL('http://localhost:5001/get-email-detail');
      url.searchParams.append('id', emailId);  // Changed from 'emailId' to 'id'
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response for email content:", errorText);
        throw new Error(`Failed to fetch email: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Check if the response contains the correct format
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
        const response = await fetch('http://localhost:5001/auth/verify-token', {
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

      {loading ? (
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
                  <div className="flex-shrink-0 text-sm text-gray-500">{email.date}</div>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[120vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-medium truncate">{selectedEmail.subject}</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-4 border-b">
              <div className="flex justify-between">
                <p className="text-sm font-medium">From: {selectedEmail.from}</p>
                <p className="text-sm text-gray-500">{selectedEmail.date}</p>
              </div>
              {selectedEmail.to && (
                <p className="text-sm font-medium mt-1">To: {selectedEmail.to}</p>
              )}
            </div>
            <div className="p-6 overflow-y-auto flex-grow">
              {loadingEmail ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedEmail.body ? (
                <div className="email-container">
                  <div 
                    key={`email-content-${selectedEmail.id}`}
                    className="prose prose-sm max-w-none email-content" 
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Loading email content...</p>
                </div>
              )}
            </div>
            <div className="border-t p-4 flex justify-end space-x-4">
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