const Imap = require('imap');
const { Client } = require('@microsoft/microsoft-graph-client');

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

async function createOutlookDraft(session, content, originalMail) {
    if (!session.accessToken) {
        throw new Error('No access token available');
    }

    console.log('Creating Outlook draft with token:', session.accessToken); // Debug logging

    const client = Client.init({
        authProvider: (done) => {
            done(null, session.accessToken);
        }
    });

    const message = {
        subject: `Re: ${originalMail.subject || ''}`,
        importance: 'Normal',
        body: {
            contentType: 'Text', 
            content: content
        },
        toRecipients: [{
            emailAddress: {
                address: originalMail.from
            }
        }]
    };

    try {
        const response = await client.api('/me/messages')
            .post(message);
        console.log('Draft created successfully:', response); // Debug logging
        return response;
    } catch (error) {
        console.error('Full error details:', error); // Detailed error logging
        throw error;
    }
}

module.exports = {
    createImapDraft,
    createOutlookDraft
};