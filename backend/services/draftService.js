const { ImapFlow } = require('imapflow');
const { Client } = require('@microsoft/microsoft-graph-client');

async function createImapDraft(session, ai_reply, mail_id, { mailbox = 'INBOX', treatAsUid = true } = {}) {
    const { email, password, imapServer, port } = session.imap;

    const client = new ImapFlow({
        host: imapServer,
        port: parseInt(port, 10),
        secure: true,
        auth: {
            user: email,
            pass: password
        },
        tls: { rejectUnauthorized: false }
    });

    let logoutNeeded = false;
    try {
        await client.connect();
        logoutNeeded = true;

        await client.mailboxOpen(mailbox);

        const query = treatAsUid
            ? { uid: Number(mail_id) }
            : { seq: Number(mail_id) };

        let originalHeaders = null;
        let originalBody = '';

        for await (const msg of client.fetch(query, {
            envelope: true,
            source: true,
            headers: ['from','to','cc','subject','message-id','references','in-reply-to','reply-to']
        })) {
            originalHeaders = {};
            // msg.headers is a Map
            msg.headers.forEach((val, key) => {
                // Maak consistent met eerdere structuur (arrays)
                originalHeaders[key] = [val];
            });

            if (msg.source) {
                // Simpele scheiding headers/body: eerste lege regel
                const delimiter = /\r?\n\r?\n/;
                const splitIdx = msg.source.search(delimiter);
                if (splitIdx !== -1) {
                    originalBody = msg.source.slice(splitIdx).replace(delimiter, '');
                } else {
                    originalBody = msg.source;
                }
            }
        }

        if (!originalHeaders) {
            throw new Error('Geen headers gevonden voor mail_id ' + mail_id);
        }

        function buildAndReturnDraft(originalHeaders, originalBody) {
            const subjectOriginal = (originalHeaders.subject && originalHeaders.subject[0]) || '';
            const subject = /^Re:/i.test(subjectOriginal) ? subjectOriginal : 'Re: ' + subjectOriginal;

            const replyTo = originalHeaders['reply-to'] ? originalHeaders['reply-to'][0] : null;
            const fromOriginal = originalHeaders.from ? originalHeaders.from[0] : '';
            const toHeader = replyTo || fromOriginal;

            const originalMessageId = originalHeaders['message-id'] ? originalHeaders['message-id'][0] : null;

            let references = [];
            if (originalHeaders.references && originalHeaders.references[0]) {
                references = originalHeaders.references[0].trim().split(/\s+/);
            }
            if (originalMessageId) {
                references.push(originalMessageId);
            }
            references = [...new Set(references)];

            const inReplyTo = originalMessageId || '';

            const newMessageId = '<' + Date.now() + Math.random().toString().slice(2) + '@' + imapServer + '>';

            let quoted = '';
            if (originalBody) {
                const trimmed = originalBody.slice(0, 10000);
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
            return { draftMessage, newMessageId };
        }

        const { draftMessage, newMessageId } = buildAndReturnDraft(originalHeaders, originalBody);

        // Append naar Drafts (zonder eerst mailbox te openen kan ook, maar expliciet is duidelijk)
        await client.append('Drafts', draftMessage, ['\\Draft']);

        return { messageId: newMessageId };
    } catch (err) {
        throw err;
    } finally {
        if (logoutNeeded) {
            try { await client.logout(); } catch (_) {}
        }
    }
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
        const draftReply = await client
            .api(`/me/messages/${mail_id}/createReply`)
            .post();

        const originalBody = draftReply?.body?.content || '';
        const combinedBody = `${ai_reply}\n\n${originalBody}`;

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