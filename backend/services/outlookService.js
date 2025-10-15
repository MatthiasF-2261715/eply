const fetch = require('../fetch');

async function getOutlookSentEmails(session) {
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
    // Probeer eerst de inbox folder direct
    try {
        console.log('Attempting to fetch from Inbox folder...');
        const inboxFolderEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=10&$orderby=receivedDateTime desc';
        const response = await fetch(inboxFolderEndpoint, session.accessToken);
        
        console.log('Inbox folder response count:', response.value?.length || 0);
        
        if (response.value && response.value.length > 0) {
            console.log('Successfully fetched from inbox folder');
            return response.value;
        }
    } catch (error) {
        console.error('Error fetching from inbox folder:', error);
    }

    // Fallback 1: Probeer zonder isDraft filter
    try {
        console.log('Trying without isDraft filter...');
        const endpoint = 'https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc';
        const response = await fetch(endpoint, session.accessToken);
        
        console.log('Messages without filter count:', response.value?.length || 0);
        
        if (response.value && response.value.length > 0) {
            // Filter drafts manually
            const nonDrafts = response.value.filter(msg => !msg.isDraft);
            console.log('Non-draft messages:', nonDrafts.length);
            return nonDrafts;
        }
    } catch (error) {
        console.error('Error fetching without filter:', error);
    }

    // Fallback 2: Probeer met inferenceClassification
    try {
        console.log('Trying with inferenceClassification...');
        const endpoint = 'https://graph.microsoft.com/v1.0/me/messages?$filter=inferenceClassification eq \'focused\'&$top=10&$orderby=receivedDateTime desc';
        const response = await fetch(endpoint, session.accessToken);
        
        console.log('Focused messages count:', response.value?.length || 0);
        
        if (response.value && response.value.length > 0) {
            return response.value.filter(msg => !msg.isDraft);
        }
    } catch (error) {
        console.error('Error fetching focused messages:', error);
    }

    // Fallback 3: Check permissions
    try {
        console.log('Checking mailbox settings and permissions...');
        const mailboxEndpoint = 'https://graph.microsoft.com/v1.0/me/mailboxSettings';
        const mailboxSettings = await fetch(mailboxEndpoint, session.accessToken);
        console.log('Mailbox settings:', mailboxSettings);
    } catch (error) {
        console.error('Error checking mailbox settings:', error);
    }

    console.warn('All methods failed to fetch emails');
    return [];
}

module.exports = { getOutlookSentEmails, getOutlookInboxEmails };