const fetch = require('../fetch');
const { transformMail } = require('../utils/emailTransform');

async function getOutlookSentEmails(session) {
    const sentEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=5&$orderby=sentDateTime desc';
    const response = await fetch(sentEndpoint, session.accessToken);
    return (response.value || []).map(mail => transformMail(mail, 'outlook'));
}

async function getOutlookInboxEmails(session) {
    const inboxEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=5&$orderby=receivedDateTime desc';
    const response = await fetch(inboxEndpoint, session.accessToken);
    return (response.value || []).map(mail => transformMail(mail, 'outlook'));
}

module.exports = { getOutlookSentEmails, getOutlookInboxEmails };