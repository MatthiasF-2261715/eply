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
            snippet: mail.bodyPreview || '',
            raw: mail
        };
    } else if (method === 'imap') {
        return {
            id: mail.attrs?.uid ? String(mail.attrs.uid) : null,
            from: Array.isArray(mail.header?.from) ? mail.header.from.join(', ') : '',
            to: Array.isArray(mail.header?.to) ? mail.header.to.join(', ') : null,
            subject: Array.isArray(mail.header?.subject) ? mail.header.subject.join(' ') : '',
            date: Array.isArray(mail.header?.date) ? mail.header.date[0] : '',
            snippet: '', // IMAP headers bevatten geen snippet/body preview
            raw: mail
        };
    }
    return mail;
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

router.post('/ai/reply', isAuthenticated, async function (req, res) {
    let { email, content } = req.body;
    if (!email || !content) {
        return res.status(400).json({ error: 'Email en content zijn verplicht.' });
    }
    email = extractEmail(email);
    try {
        console.log('EMAIL:', { email, content });
        const assistantObj = await getAssistantByEmail(email);
        const assistantId = assistantObj.assistant_id || assistantObj.id; // <-- alleen de string!
        console.log('Assistant ID:', assistantId);
        const aiResponse = await useAssistant(assistantId, content);
        console.log('AI Response:', aiResponse);
        res.json({ response: aiResponse });
    } catch (err) {
        res.status(500).json({ error: err.message || 'AI response error' });
    }
});

module.exports = router;