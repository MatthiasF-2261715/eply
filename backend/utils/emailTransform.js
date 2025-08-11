function transformMail(mail, method) {
    if (method === 'outlook') {
        return {
            id: mail.id,
            from: mail.from?.emailAddress?.address || null,
            to: mail.toRecipients?.map(r => r.emailAddress?.address).join(', ') || null,
            subject: mail.subject || '',
            date: mail.receivedDateTime || '',
            content: extractPlainText(mail.body?.content) || mail.bodyPreview || '',
            raw: mail
        };
    } else if (method === 'imap') {
        const rawContent = Array.isArray(mail.body) ? mail.body[0] : mail.body;
        return {
            id: mail.attrs?.uid ? String(mail.attrs.uid) : null,
            from: Array.isArray(mail.header?.from) ? mail.header.from[0] : '',
            to: Array.isArray(mail.header?.to) ? mail.header.to[0] : null,
            subject: Array.isArray(mail.header?.subject) ? mail.header.subject[0] : '',
            date: Array.isArray(mail.header?.date) ? mail.header.date[0] : '',
            content: extractPlainText(rawContent) || '',
            raw: mail
        };
    }
    return mail;
}

function extractPlainText(content) {
    if (!content) return '';
    content = content.replace(/^(Content-Type|Content-Transfer-Encoding):.*$/gm, '')
                    .replace(/^--_.*$/gm, '')
                    .replace(/<[^>]*>/g, '')
                    .replace(/=\r\n/g, '')
                    .replace(/=[0-9A-F]{2}/g, '')
                    .trim();
    
    const lines = content.split('\n');
    const uniqueLines = [...new Set(lines)];
    return uniqueLines.join('\n').replace(/\n\s*\n/g, '\n');
}

function extractEmail(str) {
    const match = str.match(/<([^>]+)>/);
    if (match) return match[1].trim();
    return str.trim();
}

module.exports = {
    transformMail,
    extractPlainText,
    extractEmail
};