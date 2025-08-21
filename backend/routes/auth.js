/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var express = require('express');

const authProvider = require('../auth/AuthProvider');
const Imap = require('imap');
const { FRONTEND_URL, BACKEND_URL, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('../auth/authConfig');

const router = express.Router();

router.get('/outlook-login', (req, res, next) => {
    authProvider.login({
        scopes: ["openid", "profile", "User.Read", "Mail.Read", "Mail.ReadWrite"],
        redirectUri: REDIRECT_URI,
        successRedirect: `${BACKEND_URL}/auth/acquireOutlookToken`
    })(req, res, next);
});

router.post('/imap-login', async (req, res) => {
    const { email, password, imapServer, port } = req.body;
    console.log(req.body);
    if (!email || !password || !imapServer || !port) {
        return res.status(400).json({ error: 'Vul alle velden in.' });
    }

    const imap = new Imap({
        user: email,
        password: password,
        host: imapServer,
        port: parseInt(port, 10),
        tls: true,
        tlsOptions: { 
            rejectUnauthorized: false,
            enableTrace: true,
            secureProtocol: 'TLSv1_2_method'
        },
        connTimeout: 10000, // Connection timeout in ms
        authTimeout: 5000,  // Auth timeout in ms
        debug: (info) => console.log('[IMAP Debug]:', info)
    });

    let connectionAttempts = 0;
    const maxAttempts = 3;

    function attemptConnection() {
        connectionAttempts++;
        
        imap.once('ready', function() {
            console.log('[IMAP] Connection ready');
            req.session.isAuthenticated = true;
            req.session.imap = { email, password, imapServer, port };
            req.session.method = 'imap';
            imap.end();
            res.json({ success: true });
        });

        imap.once('error', function(err) {
            console.error('[IMAP] Error:', err);
            if (connectionAttempts < maxAttempts) {
                console.log(`[IMAP] Retrying connection (${connectionAttempts}/${maxAttempts})`);
                setTimeout(attemptConnection, 2000); // Wait 2s before retry
            } else {
                res.status(401).json({ 
                    error: `IMAP inloggen mislukt: ${err.message}. Controleer je inloggegevens en probeer het opnieuw.` 
                });
            }
        });

        imap.once('end', function() {
            console.log('[IMAP] Connection ended');
        });

        try {
            imap.connect();
        } catch (err) {
            console.error('[IMAP] Connection error:', err);
            res.status(401).json({ error: 'Verbinding maken mislukt' });
        }
    }

    attemptConnection();
});

router.get('/acquireOutlookToken', authProvider.acquireToken({
    scopes: ["openid", "profile", "User.Read", "Mail.Read"],
    redirectUri: REDIRECT_URI,
    successRedirect: `${FRONTEND_URL}/dashboard`
}));

router.post('/redirect', authProvider.handleRedirect());

router.get('/signout', (req, res, next) => {
    if (req.session.method === 'outlook') {
        authProvider.logout({
            postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI
        })(req, res, next);
    } else if (req.session.method === 'imap') {
        req.session.destroy(() => {
            res.redirect(POST_LOGOUT_REDIRECT_URI); // of res.json({ success: true });
        });
    } else {
        req.session.destroy(() => {
            res.redirect(POST_LOGOUT_REDIRECT_URI);
        });
    }
});

module.exports = router;