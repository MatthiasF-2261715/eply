const { htmlToText } = require('html-to-text');
const he = require('he');

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

    // Detect & rudimentair quoted-printable decode (voor mail body fragments)
    const maybeQP = /=\r?\n/.test(content) || /=[0-9A-F]{2}/i.test(content);
    if (maybeQP) {
        content = content
            .replace(/=\r?\n/g, '')                 // soft line breaks
            .replace(/=([0-9A-F]{2})/gi, (_, h) => {
                try { return Buffer.from(h, 'hex').toString('latin1'); } catch { return ''; }
            });
    }

    // Base64 blokken (heel simplistisch) – alleen decoderen als het er "schoon" uitziet
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(content) && /[A-Za-z0-9+/=]{40,}/.test(content) && !/<[a-z][\s\S]*>/i.test(content)) {
        try {
            const b = content.replace(/\s+/g, '');
            const decoded = Buffer.from(b, 'base64').toString('utf8');
            // Heuristiek: als gedecodeerde tekst leesbaarder is, gebruik die
            if (decoded.replace(/[^\x20-\x7E\n\r\t]/g, '').length / decoded.length > 0.9) {
                content = decoded;
            }
        } catch {}
    }

    let text = '';
    const looksLikeHTML = /<\/?[a-z][\s\S]*>/i.test(content) || /&[a-z0-9#]+;/.test(content);

    if (looksLikeHTML) {
        try {
            text = htmlToText(content, {
                wordwrap: false,
                selectors: [
                    { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
                    { selector: 'img', format: 'skip' },
                    { selector: 'script', format: 'skip' },
                    { selector: 'style', format: 'skip' }
                ]
            });
        } catch {
            // fallback eenvoudige strip
            text = content.replace(/<[^>]+>/g, ' ');
        }
    } else {
        text = content;
    }

    // Decode HTML entities
    try {
        text = he.decode(text);
    } catch {}

    // Normalisaties
    text = text
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+|\s+$/g, '');

    // Duplicaatlijnen verwijderen op een veilige manier (bewaar volgorde)
    const seen = new Set();
    text = text
        .split('\n')
        .filter(l => {
            const k = l.trim();
            if (!k) return true;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        })
        .join('\n');

    return text;
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