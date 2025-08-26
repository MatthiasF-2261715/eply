const Imap = require('imap');
const { Client } = require('@microsoft/microsoft-graph-client');

async function createImapDraft(session, ai_reply, mail_id, { mailbox = 'INBOX', treatAsUid = true } = {}) {
    return new Promise((resolve, reject) => {
        const { email, password, imapServer, port } = session.imap;
        const imap = new Imap({
            user: email,
            password,
            host: imapServer,
            port: parseInt(port, 10),
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        function buildReplyAndAppend(originalHeaders, originalBody) {
            const subjectOriginal = (originalHeaders.subject && originalHeaders.subject[0]) || '';
            const subject = /^Re:/i.test(subjectOriginal) ? subjectOriginal : 'Re: ' + subjectOriginal;

            const replyTo = originalHeaders['reply-to'] ? originalHeaders['reply-to'][0] : null;
            const fromOriginal = originalHeaders.from ? originalHeaders.from[0] : '';
            const toHeader = replyTo || fromOriginal;

            const originalMessageId = originalHeaders['message-id'] ? originalHeaders['message-id'][0] : null;

            let references = [];
            if (originalHeaders.references) {
                references = originalHeaders.references[0].trim().split(/\s+/);
            }
            if (originalMessageId) {
                references.push(originalMessageId);
            }
            // Unieke references
            references = [...new Set(references)];

            const inReplyTo = originalMessageId ? originalMessageId : '';

            const newMessageId = '<' + Date.now() + Math.random().toString().slice(2) + '@' + imapServer + '>';

            // Simpele quote van originele body (alleen eerste 1000 chars om te beperken)
            let quoted = '';
            if (originalBody) {
                const trimmed = originalBody.slice(0, 10000); // limiet
                quoted = trimmed
                    .split(/\r?\n/)
                    .map(l => '> ' + l)
                    .join('\r\n');
            }

            const replyBody = [
                ai_reply.trim(),
                '',
                quoted
            ].join('\r\n');

            const headers = [
                'From: <' + email + '>',
                'To: ' + toHeader,
                originalHeaders.cc ? 'Cc: ' + originalHeaders.cc.join(', ') : null,
                'Subject: ' + subject.replace(/[\r\n]/g, ''),
                'Message-ID: ' + newMessageId,
                inReplyTo ? 'In-Reply-To: ' + inReplyTo : null,
                references.length ? 'References: ' + references.join(' ') : null,
                'Date: ' + new Date().toUTCString(),
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=utf-8',
                'Content-Transfer-Encoding: 7bit'
            ].filter(Boolean).join('\r\n');

            const draftMessage = headers + '\r\n\r\n' + replyBody + '\r\n';

            const draftFolder = 'Drafts';
            imap.openBox(draftFolder, false, (err) => {
                if (err) {
                    console.log('Error opening Drafts:', err);
                    return reject(err);
                }
                imap.append(draftMessage, { mailbox: draftFolder, flags: ['\\Draft'] }, (err) => {
                    if (err) {
                        console.log('Error appending draft:', err);
                        return reject(err);
                    }
                    // Klein uitstel om zeker te zijn dat server klaar is
                    setTimeout(() => {
                        imap.closeBox(true, () => {
                            imap.end();
                            resolve({ messageId: newMessageId });
                        });
                    }, 1000);
                });
            });
        }

        imap.once('ready', () => {
            imap.openBox(mailbox, false, (err) => {
                if (err) {
                    console.log('Error opening mailbox:', err);
                    imap.end();
                    return reject(err);
                }

                const fetchOptions = {
                    bodies: [
                        'HEADER.FIELDS (FROM TO CC SUBJECT MESSAGE-ID REFERENCES IN-REPLY-TO REPLY-TO)',
                        'TEXT'
                    ],
                    struct: false
                };
                if (treatAsUid) fetchOptions.uid = true;

                const f = imap.fetch(mail_id, fetchOptions);
                let headerBuffer = '';
                let bodyBuffer = '';

                f.on('message', (msg) => {
                    msg.on('body', (stream, info) => {
                        let chunk = '';
                        stream.on('data', (d) => { chunk += d.toString('utf8'); });
                        stream.on('end', () => {
                            if (info.which && info.which.startsWith('HEADER')) {
                                headerBuffer += chunk;
                            } else {
                                bodyBuffer += chunk;
                            }
                        });
                    });
                });

                f.once('error', (err) => {
                    console.log('Fetch error:', err);
                    reject(err);
                });

                f.once('end', () => {
                    if (!headerBuffer) {
                        return reject(new Error('Geen headers gevonden voor mail_id ' + mail_id));
                    }
                    const originalHeaders = Imap.parseHeader(headerBuffer);
                    buildReplyAndAppend(originalHeaders, bodyBuffer);
                });
            });
        });

        imap.once('error', (err) => {
            console.log('IMAP connection error:', err);
            reject(err);
        });

        imap.connect();
    });
}

async function createOutlookDraft(session, ai_reply, mail_id) {
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
        const combinedBody = `${ai_reply}\n\n${originalBody}`;

        // 3. Update draft met jouw content
        const updatedDraft = await client
            .api(`/me/messages/${draftReply.id}`)
            .update({
                body: {
                    contentType: 'HTML', // Pas aan naar 'HTML' indien ai_reply HTML bevat
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