var express = require('express');
var router = express.Router();

var fetch = require('../fetch');
const Imap = require('imap');
var { GRAPH_ME_ENDPOINT } = require('../authConfig');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/outlook-login'); // redirect to sign-in route
    }
    next();
};

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
            res.json({ mails: mailsResponse.value });
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
                const f = imap.seq.fetch('1:10', { bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)'], struct: true });
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
                        mails.push(mail);
                    });
                });
                f.once('end', () => {
                    imap.end();
                    res.json(mails);
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

module.exports = router;