const fetch = require('../fetch');

async function getOutlookSentEmails(session) {
    const sentEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=10&$orderby=sentDateTime desc';
    try {
        const response = await fetch(sentEndpoint, session.accessToken);
        console.log('Sent emails response:', response);
        return response.value || [];
    } catch (error) {
        console.error('Error fetching sent emails:', error);
        // Check of het een 403/404 error is
        if (error.status === 404) {
            console.log('SentItems folder not found, trying alternative');
            // Probeer alternative folder structure
            const altEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders?$filter=displayName eq \'Sent Items\'';
            const folders = await fetch(altEndpoint, session.accessToken);
            console.log('Available folders:', folders);
        }
        return [];
    }
}

async function getOutlookInboxEmails(session) {
    const inboxEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=10&$orderby=receivedDateTime desc';
    try {
        const response = await fetch(inboxEndpoint, session.accessToken);
        console.log('Inbox emails response:', response);
        return response.value || [];
    } catch (error) {
        console.error('Error fetching inbox emails:', error);
        if (error.status === 404) {
            // Probeer direct messages ophalen zonder folder
            const altEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$top=10&$filter=isRead eq false&$orderby=receivedDateTime desc';
            const response = await fetch(altEndpoint, session.accessToken);
            return response.value || [];
        }
        return [];
    }
}

module.exports = { getOutlookSentEmails, getOutlookInboxEmails };
