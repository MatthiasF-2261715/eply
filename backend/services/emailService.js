const { getOutlookSentEmails, getOutlookInboxEmails } = require('./outlookService');
const { getImapSentEmails, getImapInboxEmails } = require('./imapService');

async function getSentEmails(method, session) {
    console.log('Fetching sent emails for method:', method);
    if (method === 'outlook') {
        return getOutlookSentEmails(session);
    } else if (method === 'imap') {
        return getImapSentEmails(session.imap);
    }
    return [];
}

async function getInboxEmails(method, session) {
    console.log('Fetching inbox emails for method:', method);
    if (method === 'outlook') {
        return getOutlookInboxEmails(session);
    } else if (method === 'imap') {
        return getImapInboxEmails(session.imap);
    }
    return [];
}

module.exports = { getSentEmails, getInboxEmails };