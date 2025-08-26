const Imap = require('imap');
const { Client } = require('@microsoft/microsoft-graph-client');

function escapeHtml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function plainTextToHtmlBlock(txt = '') {
    const escaped = escapeHtml(txt);
    // behoud meerdere spaties
    let html = escaped.replace(/ {2,}/g, m => '&nbsp;'.repeat(m.length - 1) + ' ');
    // newlines -> <br>
    html = html.replace(/\r\n|\r|\n/g, '<br>');
    // Gebruik een <div> met data marker (of <pre> als <div> nog niet genoeg is)
    return `<div data-ai-reply style="font-family:inherit;line-height:1.4;white-space:normal;">${html}</div><br><br>`;
}

function injectAiReply(originalHtml = '', aiReplyBlock = '') {
    if (!originalHtml) return aiReplyBlock;
    if (originalHtml.includes('data-ai-reply')) return originalHtml; // al geïnjecteerd

    // Mogelijke Outlook markers (desktop / web)
    const markerRegexes = [
        /<div id="divRplyFwdMsg"[^>]*>/i,              // Klassieke reply/forward marker
        /<div class="OutlookMessageHeader"[^>]*>/i,     // Web / andere variant
        /<!--\s*StartFragment\s*-->/i                   // Soms bij clipboard / fragmenten
    ];

    let markerMatch = null;
    for (const r of markerRegexes) {
        const m = originalHtml.match(r);
        if (m) { markerMatch = m[0]; break; }
    }

    if (markerMatch) {
        const idx = originalHtml.indexOf(markerMatch);
        if (idx > -1) {
            return originalHtml.slice(0, idx) + aiReplyBlock + markerMatch + originalHtml.slice(idx + markerMatch.length);
        }
    }

    // Fallback: na <body>
    const bodyOpen = originalHtml.match(/<body[^>]*>/i);
    if (bodyOpen) {
        return originalHtml.replace(/<body[^>]*>/i, m => m + aiReplyBlock);
    }

    // Laatste fallback: prepend
    return aiReplyBlock + originalHtml;
}

async function createImapDraft(session, content, originalMail) {
    return new Promise((resolve, reject) => {
        const { email, password, imapServer, port } = session.imap;
        
        const imap = new Imap({
            user: email,
            password: password,
            host: imapServer,
            port: parseInt(port, 10),
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        const draftMessage = [
            'From: <' + email + '>',
            'To: <' + originalMail.from + '>',
            'Subject: Re: ' + (originalMail.subject || '').replace(/[\r\n]/g, ''),
            'Message-ID: <' + Date.now() + Math.random().toString().substr(2) + '@' + imapServer + '>',
            'Date: ' + new Date().toUTCString(),
            'Content-Type: text/plain; charset=utf-8',
            'Content-Transfer-Encoding: 7bit',
            'MIME-Version: 1.0',
            '',
            content,
            ''  
        ].join('\r\n');

        imap.once('ready', function() {
            console.log('IMAP connection ready');
            const draftFolder = 'Drafts';

            imap.openBox(draftFolder, false, (err) => {
                if (err) {
                    console.log('Error opening folder:', err);
                    imap.end();
                    reject(err);
                    return;
                }

                console.log('Successfully opened folder');
                imap.append(draftMessage, {
                    mailbox: draftFolder,
                    flags: ['\\Draft']
                }, (err) => {
                    if (err) {
                        console.log('Error creating draft:', err);
                        imap.end();
                        reject(err);
                        return;
                    }
                    
                    // Simple delay to allow server to process
                    setTimeout(() => {
                        imap.closeBox((err) => {
                            if (err) console.log('Error closing box:', err);
                            imap.end();
                            resolve();
                        });
                    }, 2000);
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
    if (!session?.accessToken) throw new Error('No access token available');
    if (!mail_id) throw new Error('mail_id is required to create a reply draft');

    const client = Client.init({
        authProvider: done => done(null, session.accessToken)
    });

    try {
        const draftReply = await client
            .api(`/me/messages/${mail_id}/createReply`)
            .post();

        const originalBody = draftReply?.body?.content || '';
        const aiBlock = plainTextToHtmlBlock(ai_reply);
        const combinedBody = injectAiReply(originalBody, aiBlock);

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