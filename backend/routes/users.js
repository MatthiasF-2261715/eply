var express = require('express');
var router = express.Router();

var fetch = require('../fetch');
const Imap = require('imap');
var { GRAPH_ME_ENDPOINT } = require('../authConfig');

const { getAssistantByEmail } = require('../database');
const { useAssistant } = require('../assistant');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/outlook-login'); // redirect to sign-in route
    }
    next();
};

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
        // Get content, avoiding duplicates
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

// Helper function to extract plain text from email content, otherwise a lot of crap in mail
function extractPlainText(content) {
    if (!content) return '';
    
    // Remove MIME headers and markers
    content = content.replace(/^(Content-Type|Content-Transfer-Encoding):.*$/gm, '')
                    .replace(/^--_.*$/gm, '')
                    .replace(/<[^>]*>/g, '')
                    .replace(/=\r\n/g, '')
                    .replace(/=[0-9A-F]{2}/g, '')
                    .trim();
    
    // Remove duplicate paragraphs
    const lines = content.split('\n');
    const uniqueLines = [...new Set(lines)];
    
    return uniqueLines.join('\n').replace(/\n\s*\n/g, '\n');
}

router.get('/id',
    isAuthenticated,
    async function (req, res, next) {
        res.render('id', { idTokenClaims: req.session.account?.idTokenClaims });
    }
);

router.get('/profile', isAuthenticated, async function (req, res, next) {
    if (req.session.method === 'outlook') {
        try {
            if (!req.session.accessToken) {
                return res.status(401).json({ error: 'No access token in session' });
            }
            const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
            res.json({
                profile: graphResponse,
                username: graphResponse.displayName || graphResponse.mail || graphResponse.userPrincipalName
            });
        } catch (error) {
            if (error.message && error.message.includes('401')) {
                return res.status(401).json({ error: 'Access token expired or invalid' });
            }
            res.status(500).json({ error: 'Error fetching profile' });
        }
    } else if (req.session.method === 'imap') {
        if (!req.session.imap) {
            return res.status(401).json({ error: 'Niet ingelogd via IMAP.' });
        }
        const { email, imapServer } = req.session.imap;
        res.json({
            profile: { email, imapServer },
            username: email
        });
    } else {
        res.status(401).json({ error: 'Niet ingelogd.' });
    }
});

router.get('/mails', isAuthenticated, async function (req, res, next) {
    if (req.session.method === 'outlook') {
        try {
            if (!req.session.accessToken) {
                return res.status(401).json({ error: 'No access token in session' });
            }
            const mailsEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc';
            const mailsResponse = await fetch(mailsEndpoint, req.session.accessToken);
            const mails = (mailsResponse.value || []).map(mail => transformMail(mail, 'outlook'));
            res.json({ mails });
        } catch (error) {
            if (error.status === 401) {
                return res.status(401).json({ error: 'Access token expired or invalid' });
            }
            res.status(500).json({ error: 'Error fetching mails' });
        }
    } else if (req.session.method === 'imap') {
        if (!req.session.imap) {
            return res.status(401).json({ error: 'Niet ingelogd via IMAP.' });
        }
        const { email, password, imapServer, port } = req.session.imap;
        const imap = new Imap({
            user: email,
            password: password,
            host: imapServer,
            port: parseInt(port, 10),
            tls: true
        });

        imap.once('ready', function() {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    imap.end();
                    return res.status(500).json({ error: 'Kan mailbox niet openen.' });
                }
                const total = box.messages.total;
                if (total === 0) {
                    imap.end();
                    return res.json({ mails: [] });
                }
                const start = Math.max(1, total - 9);
                const range = `${start}:${total}`;
                const f = imap.seq.fetch(range, { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true });
                const mails = [];
                f.on('message', (msg) => {
                    let mail = {};
                    msg.on('body', (stream) => {
                        let buffer = '';
                        stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
                        stream.on('end', () => {
                            mail.header = Imap.parseHeader(buffer);
                        });
                    });
                    msg.once('attributes', (attrs) => {
                        mail.attrs = attrs;
                    });
                    msg.once('end', () => {
                        mails.push(transformMail(mail, 'imap'));
                    });
                });
                f.once('end', () => {
                    imap.end();
                    // Reverse zodat nieuwste eerst
                    res.json({ mails: mails.reverse() });
                });
            });
        });

        imap.once('error', function(err) {
            res.status(500).json({ error: 'IMAP fout: ' + err.message });
        });

        imap.connect();
    } else {
        res.status(401).json({ error: 'Niet ingelogd.' });
    }
});


function extractEmail(str) {
    const match = str.match(/<([^>]+)>/);
    if (match) return match[1].trim();
    return str.trim();
}

async function getSentEmails(method, session) {
    if (method === 'outlook') {
        const sentEndpoint = 'https://graph.microsoft.com/v1.0/me/mailFolders/SentItems/messages?$top=5&$orderby=sentDateTime desc';
        const response = await fetch(sentEndpoint, session.accessToken);
        return (response.value || []).map(mail => transformMail(mail, 'outlook'));
    } 
    
    else if (method === 'imap') {
        return new Promise((resolve, reject) => {
            const { email, password, imapServer, port } = session.imap;
            const imap = new Imap({
                user: email,
                password: password,
                host: imapServer,
                port: parseInt(port, 10),
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 10000, // Connection timeout
                authTimeout: 5000   // Auth timeout
            });

            let timeoutId = setTimeout(() => {
                imap.end();
                reject(new Error('IMAP connection timeout'));
            }, 30000); // 30 second total timeout

            imap.once('ready', function() {
                clearTimeout(timeoutId);
                
                // Try multiple sent folder names
                const sentFolders = ['[Gmail]/Sent Mail', 'Sent', 'SENT'];
                let folderIndex = 0;

                function tryNextFolder() {
                    if (folderIndex >= sentFolders.length) {
                        imap.end();
                        reject(new Error('Could not find sent folder'));
                        return;
                    }

                    imap.openBox(sentFolders[folderIndex], true, (err, box) => {
                        if (err) {
                            folderIndex++;
                            tryNextFolder();
                            return;
                        }
                        fetchEmails(box);
                    });
                }

                tryNextFolder();
            });

            function fetchEmails(box) {
                const mails = [];
                const total = box.messages.total;
                const start = Math.max(1, total - 4);
                const range = `${start}:${total}`;

                const f = imap.seq.fetch(range, {
                    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                    struct: true
                });

                f.on('message', (msg) => {
                    let mail = { header: null, body: '' };
                    
                    msg.on('body', (stream, info) => {
                        let buffer = '';
                        stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
                        stream.on('end', () => {
                            if (info.which === 'TEXT') {
                                mail.body = buffer;
                            } else {
                                mail.header = Imap.parseHeader(buffer);
                            }
                        });
                    });
                    
                    msg.once('attributes', (attrs) => {
                        mail.attrs = attrs;
                    });
                    
                    msg.once('end', () => {
                        const transformedMail = transformMail({...mail, content: mail.body}, 'imap');
                        mails.push(transformedMail);
                    });
                });

                f.once('error', (err) => {
                    imap.end();
                    reject(new Error(`Fetch error: ${err.message}`));
                });

                f.once('end', () => {
                    imap.end();
                    resolve(mails.reverse());
                });
            }

            imap.once('error', (err) => {
                clearTimeout(timeoutId);
                reject(new Error(`IMAP error: ${err.message}`));
            });

            imap.once('end', () => {
                clearTimeout(timeoutId);
            });

            imap.connect();
        });
    }
    return [];
}
  
  // Modify the AI reply endpoint
  router.post('/ai/reply', isAuthenticated, async function (req, res) {
      let { email, content } = req.body;
      if (!email || !content) {
          return res.status(400).json({ error: 'Email en content zijn verplicht.' });
      }
      email = extractEmail(email);
      try {
          const sentEmails = await getSentEmails(req.session.method, req.session);
          const assistantObj = await getAssistantByEmail(email);
          const assistantId = assistantObj.assistant_id || assistantObj.id;
          
          const currentEmail = { from: email, content };
          const aiResponse = await useAssistant(assistantId, currentEmail, sentEmails);
          
          res.json({ response: aiResponse });
      } catch (err) {
          res.status(500).json({ error: err.message || 'AI response error' });
      }
  });

module.exports = router;