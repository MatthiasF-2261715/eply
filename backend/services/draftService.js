const Imap = require('imap');
const { Client } = require('@microsoft/microsoft-graph-client');
const { htmlToText } = require('html-to-text'); 

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function createImapDraft(session, ai_reply, mail_id, { mailbox = 'INBOX', treatAsUid = true } = {}) {
    if (!session?.imap) throw new Error('IMAP sessie ontbreekt');
    if (!ai_reply) throw new Error('ai_reply ontbreekt');
    if (!mail_id) throw new Error('mail_id ontbreekt');

    const { email, password, imapServer, port } = session.imap;
    const imap = new Imap({
        user: email,
        password,
        host: imapServer,
        port: parseInt(port, 10),
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    const QUOTE_LIMIT = 10000;
    const DRAFTS = 'Drafts';

    function findPart(struct, subtype) {
        if (!struct) return null;
        for (const p of struct) {
            if (Array.isArray(p)) {
                const n = findPart(p, subtype);
                if (n) return n;
            } else if (p?.type === 'text' && p?.subtype?.toLowerCase() === subtype) {
                return p;
            } else if (p?.parts) {
                const n = findPart(p.parts, subtype);
                if (n) return n;
            }
        }
        return null;
    }

    function fetchSingle(id, opts) {
        return new Promise((resolve, reject) => {
            if (treatAsUid) opts.uid = true;
            const f = imap.fetch(id, opts);
            const chunks = [];
            let attrs = null;
            f.on('message', msg => {
                msg.on('body', stream => {
                    stream.on('data', d => chunks.push(d));
                });
                msg.on('attributes', a => { attrs = a; });
            });
            f.once('error', reject);
            f.once('end', () => resolve({ buffer: Buffer.concat(chunks), attrs }));
        });
    }

    function fetchHeaders(id) {
        return fetchSingle(id, {
            bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT MESSAGE-ID REFERENCES IN-REPLY-TO REPLY-TO)'],
            struct: true
        });
    }

    function fetchPartText(id, part, isHtml) {
        if (!part?.partID) return Promise.resolve('');
        return new Promise((resolve, reject) => {
            const opts = { bodies: [part.partID], struct: false };
            if (treatAsUid) opts.uid = true;
            const f = imap.fetch(id, opts);
            const chunks = [];
            f.on('message', m => {
                m.on('body', s => s.on('data', d => chunks.push(d)));
            });
            f.once('error', reject);
            f.once('end', () => {
                let txt = Buffer.concat(chunks).toString(part.params?.charset ? undefined : 'utf8');
                if (isHtml) {
                    try {
                        txt = htmlToText(txt, {
                            wordwrap: false,
                            selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }]
                        }).trim();
                    } catch {}
                }
                resolve(txt);
            });
        });
    }

    return new Promise((resolve, reject) => {
        let done = false;

        imap.once('ready', async () => {
            try {
                // Open source mailbox
                await new Promise((res, rej) => imap.openBox(mailbox, false, e => e ? rej(e) : res()));

                // Headers + struct
                const { buffer, attrs } = await fetchHeaders(mail_id);
                if (!buffer.length) throw new Error('Geen headers gevonden');
                const originalHeaders = Imap.parseHeader(buffer.toString('utf8'));

                // Body ophalen (plain > html fallback)
                let originalBody = '';
                if (attrs?.struct) {
                    const plain = findPart(attrs.struct, 'plain');
                    const html = findPart(attrs.struct, 'html');
                    if (plain) originalBody = await fetchPartText(mail_id, plain, false);
                    else if (html) originalBody = await fetchPartText(mail_id, html, true);
                }
                originalBody = originalBody
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n')
                    .split('\n')
                    .map(l => l.replace(/\s+$/, ''))
                    .join('\n')
                    .trim();

                // Headers samenstellen
                const subjectOrig = originalHeaders.subject?.[0] || '';
                const subject = /^Re:/i.test(subjectOrig) ? subjectOrig : 'Re: ' + subjectOrig;
                const replyTo = originalHeaders['reply-to']?.[0];
                const toHeader = replyTo || originalHeaders.from?.[0] || '';
                const origMsgId = originalHeaders['message-id']?.[0] || '';
                const refSet = new Set();
                if (originalHeaders.references?.[0]) originalHeaders.references[0].trim().split(/\s+/).forEach(r => refSet.add(r));
                if (origMsgId) refSet.add(origMsgId);
                const references = Array.from(refSet);
                const newMessageId = `<${Date.now()}${Math.random().toString().slice(2)}@${imapServer}>`;

                const quoted = originalBody
                    ? originalBody.slice(0, QUOTE_LIMIT).split('\n').map(l => '> ' + l).join('\r\n')
                    : '';

                const body = [ai_reply.trim(), '', quoted].join('\r\n');

                const headerLines = [
                    `From: <${email}>`,
                    `To: ${toHeader}`,
                    originalHeaders.cc ? 'Cc: ' + originalHeaders.cc.join(', ') : null,
                    'Subject: ' + subject.replace(/[\r\n]/g, ''),
                    'Message-ID: ' + newMessageId,
                    origMsgId ? 'In-Reply-To: ' + origMsgId : null,
                    references.length ? 'References: ' + references.join(' ') : null,
                    'Date: ' + new Date().toUTCString(),
                    'MIME-Version: 1.0',
                    'Content-Type: text/plain; charset=utf-8',
                    'Content-Transfer-Encoding: 7bit'
                ].filter(Boolean).join('\r\n');

                const draftRaw = headerLines + '\r\n\r\n' + body + '\r\n';

                // Open Drafts en append
                await new Promise((res, rej) => imap.openBox(DRAFTS, false, e => e ? rej(e) : res()));
                await new Promise((res, rej) => imap.append(draftRaw, { mailbox: DRAFTS, flags: ['\\Draft'] }, e => e ? rej(e) : res()));

                done = true;
                resolve({ messageId: newMessageId });
            } catch (e) {
                reject(e);
            } finally {
                try { imap.closeBox(true, () => imap.end()); } catch { try { imap.end(); } catch {} }
            }
        });

        imap.once('error', err => { if (!done) reject(err); });
        imap.connect();
    });
}

async function createOutlookDraft(session, ai_reply, mail_id) {
    console.log("ai replY:", ai_reply);
    if (!session?.accessToken) {
        throw new Error('No access token available');
    }
    if (!mail_id) {
        throw new Error('mail_id is required to create a reply draft');
    }

    const client = Client.init({
        authProvider: (done) => done(null, session.accessToken)
    });

    try {
        // 1. Maak een echte reply draft (niet reply-all)
        const draftReply = await client
            .api(`/me/messages/${mail_id}/createReply`)
            .post();

        // 2. Combineer AI reply boven de bestaande (gequote) body
        const originalBody = draftReply?.body?.content || '';
        const aiReplyHtml = `<div style="white-space:pre-wrap;font-family:inherit;font-size:inherit;">${escapeHtml(ai_reply.trim())}</div>`;
        const separator = originalBody ? '<br><br>' : '';
        const combinedBody = `${aiReplyHtml}${separator}${originalBody}`;

        // 3. Update draft met jouw content
        const updatedDraft = await client
            .api(`/me/messages/${draftReply.id}`)
            .update({
                body: {
                    contentType: 'HTML',
                    content: combinedBody
                }
            });

        return updatedDraft;
    } catch (error) {
        console.error('Error creating Outlook reply draft:', error);
        throw error;
    }
}

module.exports = {
    createImapDraft,
    createOutlookDraft
};