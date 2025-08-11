const { getOutlookEmails } = require('./outlookService');
const { getImapEmails } = require('./imapService');

async function getSentEmails(method, session) {
    console.log('Fetching sent emails for method:', method);
    if (method === 'outlook') {
        return getOutlookEmails(session);
    } else if (method === 'imap') {
        return getImapEmails(session.imap);
    }
    return [];
}

module.exports = { getSentEmails };