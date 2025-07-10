/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var express = require('express');

const authProvider = require('../auth/AuthProvider');
const Imap = require('imap');
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('../authConfig');

const router = express.Router();

router.get('/outlook-login', (req, res, next) => {
    authProvider.login({
        scopes: ["openid", "profile", "User.Read", "Mail.Read"],
        redirectUri: REDIRECT_URI,
        successRedirect: 'http://localhost:4000/auth/acquireToken'
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
        tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', function() {
        // Sessie opslaan
        req.session.isAuthenticated = true;
        req.session.imap = { email, password, imapServer, port };
        req.session.method = 'imap';
        imap.end();
        res.json({ success: true });
    });

    imap.once('error', function(err) {
        res.status(401).json({ error: 'IMAP inloggen mislukt: ' + err.message });
    });

    imap.connect();
});

router.get('/acquireToken', authProvider.acquireToken({
    scopes: ["openid", "profile", "User.Read", "Mail.Read"],
    redirectUri: REDIRECT_URI,
    successRedirect: 'http://localhost:3000/dashboard'
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