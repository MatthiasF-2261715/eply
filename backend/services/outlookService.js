const fetch = require('../fetch');
const { transformMail } = require('../utils/emailTransform');

async function getOutlookEmails(session) {
    const sentEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=5&$orderby=sentDateTime desc';
    const response = await fetch(sentEndpoint, session.accessToken);
    return (response.value || []).map(mail => transformMail(mail, 'outlook'));
}

module.exports = { getOutlookEmails };