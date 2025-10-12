const Imap = require('imap');
const { Client } = require('@microsoft/microsoft-graph-client');

function createImapConnection(session) {
    const { email, password, imapServer, port } = session.imap;
    return new Imap({
        user: email,
        password,
        host: imapServer,
        port: parseInt(port, 10),
        tls: true,
        debug: false,
        tlsOptions: { rejectUnauthorized: false }
    });
}

function fetchSingle(imap, id, opts, treatAsUid) {
    return new Promise((resolve, reject) => {
        if (treatAsUid) opts.uid = true;
        const fetch = imap.fetch(id, opts);
        const chunks = [];
        let attrs = null;
        fetch.on('message', msg => {
            msg.on('body', stream => {
                stream.on('data', data => chunks.push(data));
            });
            msg.on('attributes', attributes => { 
                attrs = attributes; 
            });
        });
        fetch.once('error', reject);
        fetch.once('end', () => resolve({ 
            buffer: Buffer.concat(chunks), 
            attrs 
        }));
    });
}

function fetchHeaders(imap, id, treatAsUid) {
    return fetchSingle(imap, id, {
        bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT MESSAGE-ID REFERENCES IN-REPLY-TO REPLY-TO)'],
        struct: true
    }, treatAsUid);
}

function buildReplyHeaders(originalHeaders, email, imapServer) {
    const subjectOrig = originalHeaders.subject?.[0] || '';
    const subject = /^Re:/i.test(subjectOrig) ? subjectOrig : 'Re: ' + subjectOrig;
    
    const replyTo = originalHeaders['reply-to']?.[0];
    const fromHeader = originalHeaders.from?.[0];
    const toHeader = replyTo || fromHeader || '';
    
    const origMsgId = originalHeaders['message-id']?.[0] || '';
    const newMessageId = `<${Date.now()}${Math.random().toString().slice(2)}@${imapServer}>`;
    
    const refSet = new Set();
    if (originalHeaders.references?.[0]) {
        // Handle multiple reference formats
        const refs = originalHeaders.references[0].trim().split(/\s+/);
        refs.forEach(ref => {
            if (ref.startsWith('<') && ref.endsWith('>')) {
                refSet.add(ref);
            }
        });
    }
    if (origMsgId && origMsgId.startsWith('<') && origMsgId.endsWith('>')) {
        refSet.add(origMsgId);
    }
    
    const references = Array.from(refSet);
    
    return {
        subject,
        toHeader,
        ccHeader: originalHeaders.cc ? originalHeaders.cc.join(', ') : null,
        newMessageId,
        origMsgId,
        references
    };
}

function createDraftMessage(headers, aiReply, email) {
    const { subject, toHeader, ccHeader, newMessageId, origMsgId, references } = headers;
    const body = aiReply.trim();
    
    const headerLines = [
        `From: <${email}>`,
        `To: ${toHeader}`,
        ccHeader ? `Cc: ${ccHeader}` : null,
        `Subject: ${subject.replace(/[\r\n]/g, '')}`,
        `Message-ID: ${newMessageId}`,
        origMsgId ? `In-Reply-To: ${origMsgId}` : null,
        references.length ? `References: ${references.join(' ')}` : null,
        `Date: ${new Date().toUTCString()}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 7bit'
    ].filter(Boolean).join('\r\n');
    
    return headerLines + '\r\n\r\n' + body + '\r\n';
}

function formatOriginalMessage(originalHeaders, originalMail) {
    const from = originalHeaders.from?.[0] || '';
    const date = originalHeaders.date?.[0] || new Date().toUTCString();
    const to = originalHeaders.to?.[0] || '';
    const subject = originalHeaders.subject?.[0] || '';
    
    // Format like Outlook does
    return `\n\n________________________________\nFrom: ${from}\nSent: ${date}\nTo: ${to}\nSubject: ${subject}\n\n${originalMail}`;
}

async function createImapDraft(session, ai_reply, mail_id, original_mail, { mailbox = 'INBOX', treatAsUid = true } = {}) {
    if (!session?.imap) throw new Error('IMAP sessie ontbreekt');
    if (!ai_reply) throw new Error('ai_reply ontbreekt');
    if (!mail_id) throw new Error('mail_id ontbreekt');
    const imap = createImapConnection(session);
    const DRAFTS = 'Drafts';
    return new Promise((resolve, reject) => {
        let done = false;
        imap.once('ready', async () => {
            try {
                await new Promise((res, rej) => 
                    imap.openBox(mailbox, false, err => err ? rej(err) : res())
                );
                const { buffer, attrs } = await fetchHeaders(imap, mail_id, treatAsUid);
                if (!buffer.length) throw new Error('Geen headers gevonden');
                const originalHeaders = Imap.parseHeader(buffer.toString('utf8'));
                const replyHeaders = buildReplyHeaders(originalHeaders, session.imap.email, session.imap.imapServer);
                
                
                let fullReply = ai_reply;
                if (original_mail) {
                    fullReply += formatOriginalMessage(originalHeaders, original_mail);
                }
                
                const draftRaw = createDraftMessage(replyHeaders, fullReply, session.imap.email);
                await new Promise((res, rej) => 
                    imap.openBox(DRAFTS, false, err => err ? rej(err) : res())
                );
                await new Promise((res, rej) => 
                    imap.append(draftRaw, { mailbox: DRAFTS, flags: ['\\Draft'] }, err => err ? rej(err) : res())
                );
                done = true;
                resolve({ messageId: replyHeaders.newMessageId });
            } catch (error) {
                reject(error);
            } finally {
                try { 
                    imap.closeBox(true, () => imap.end()); 
                } catch { 
                    try { imap.end(); } catch {} 
                }
            }
        });
        imap.once('error', err => { 
            if (!done) reject(err); 
        });
        imap.connect();
    });
}

function formatAiReplyForHtml(aiReply) {
    const escapeHtml = str =>
        str.replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;');
    return `<div style="font-family:inherit;font-size:inherit;">${escapeHtml(aiReply.trim())
        .replace(/\r\n|\r|\n/g, '<br>')}</div>`;
}

async function createOutlookDraft(session, ai_reply, mail_id) {
    if (!session?.accessToken) {
        throw new Error('No access token available');
    }
    if (!mail_id) {
        throw new Error('mail_id is required to create a reply draft');
    }
    const client = Client.init({authProvider: (done) => done(null, session.accessToken)});
    try {
        // Haal de handtekening op
        const mailboxSettings = await client.api('/me/mailboxSettings').get();
        const signature = mailboxSettings.mailSignature || '';
        const signatureEnabled = mailboxSettings.mailSignatureAutomaticallyIncluded;

        console.log("Signature:", signature);
        console.log("Signature Enabled:", signatureEnabled);

        const draftReply = await client
            .api(`/me/messages/${mail_id}/createReply`)
            .post();

        const aiReplyHtml = formatAiReplyForHtml(ai_reply);

        // Voeg de handtekening toe als die automatisch hoort te worden toegevoegd
        let bodyContent = aiReplyHtml;
        if (signature && signatureEnabled) {
            bodyContent += `<br><br>${signature}`;
        }
        bodyContent += draftReply.body.content;
        console.log("Draft Reply Body Content:", draftReply.body.content);

        const updatedDraft = await client
            .api(`/me/messages/${draftReply.id}`)
            .update({
                body: {
                    contentType: "HTML",
                    content: bodyContent
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
