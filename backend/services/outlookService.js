const fetch = require('../fetch');

async function getOutlookSentEmails(session) {
    // Gebruik /me/messages met filter in plaats van mailFolders
    const sentEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$filter=isDraft eq false and sender/emailAddress/address eq \'' + 
                         (session.account?.username || session.email) + 
                         '\'&$top=10&$orderby=sentDateTime desc';
    
    try {
        console.log('Fetching sent emails with endpoint:', sentEndpoint);
        const response = await fetch(sentEndpoint, session.accessToken);
        console.log('Sent emails response:', response);
        return response.value || [];
    } catch (error) {
        console.error('Error fetching sent emails:', error);
        
        // Fallback: probeer zonder filter
        try {
            const fallbackEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$filter=isDraft eq false&$top=10&$orderby=sentDateTime desc';
            console.log('Trying fallback endpoint:', fallbackEndpoint);
            const response = await fetch(fallbackEndpoint, session.accessToken);
            return response.value || [];
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return [];
        }
    }
}

async function getOutlookInboxEmails(session) {
    // Gebruik direct /me/messages met receivedDateTime filter
    const inboxEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$filter=isDraft eq false&$top=10&$orderby=receivedDateTime desc';
    
    try {
        console.log('Fetching inbox emails with endpoint:', inboxEndpoint);
        const response = await fetch(inboxEndpoint, session.accessToken);
        console.log('Inbox emails response:', response);
        console.log('Inbox emails count:', response.value?.length || 0);
        
        // Extra logging voor de eerste mail indien beschikbaar
        if (response.value && response.value.length > 0) {
            console.log('First email sample:', {
                subject: response.value[0].subject,
                from: response.value[0].from?.emailAddress?.address,
                receivedDateTime: response.value[0].receivedDateTime
            });
        }
        
        return response.value || [];
    } catch (error) {
        console.error('Error fetching inbox emails:', error);
        console.error('Error details:', error.message);
        
        // Probeer alternatieve methode: lijst alle messages zonder filter
        try {
            const fallbackEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc';
            console.log('Trying fallback endpoint without filter:', fallbackEndpoint);
            const response = await fetch(fallbackEndpoint, session.accessToken);
            console.log('Fallback response count:', response.value?.length || 0);
            return response.value || [];
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            return [];
        }
    }
}

module.exports = { getOutlookSentEmails, getOutlookInboxEmails };