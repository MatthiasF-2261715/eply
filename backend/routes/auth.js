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
        successRedirect:'/auth/acquireOutlookToken'
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
            servername: imapServer, // Add explicit servername
            // Remove enableTrace and secureProtocol as they can cause issues
            ciphers: 'HIGH:MEDIUM:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA'
        },
        connTimeout: 15000, // Increased timeout
        authTimeout: 10000,  // Increased auth timeout
        keepalive: {
            interval: 10000,
            idleInterval: 300000,
            forceNoop: true
        }
        // Remove debug option as it can interfere with connection
    });

    let connectionAttempts = 0;
    const maxAttempts = 3;

    function attemptConnection() {
        connectionAttempts++;
        
        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
            console.log('[IMAP] Connection timeout - ending connection');
            try {
                imap.end();
            } catch (e) {
                // Ignore cleanup errors
            }
            if (connectionAttempts < maxAttempts) {
                console.log(`[IMAP] Timeout - Retrying connection (${connectionAttempts}/${maxAttempts})`);
                setTimeout(attemptConnection, 3000);
            } else {
                res.status(408).json({ 
                    error: 'Verbinding time-out. Controleer je server instellingen.' 
                });
            }
        }, 20000); // 20 second timeout

        imap.once('ready', function() {
            console.log('[IMAP] Connection ready');
            clearTimeout(connectionTimeout);
            req.session.isAuthenticated = true;
            req.session.imap = { email, password, imapServer, port };
            req.session.method = 'imap';
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({ error: 'Session save failed' });
                }
                imap.end();
                res.json({ success: true });
            });
        });

        imap.once('error', function(err) {
            console.error('[IMAP] Error:', err);
            clearTimeout(connectionTimeout);
            if (connectionAttempts < maxAttempts) {
                console.log(`[IMAP] Retrying connection (${connectionAttempts}/${maxAttempts})`);
                setTimeout(attemptConnection, 3000); // Increased retry delay
            } else {
                res.status(401).json({ 
                    error: `IMAP inloggen mislukt: ${err.message}. Controleer je inloggegevens en probeer het opnieuw.` 
                });
            }
        });

        imap.once('end', function() {
            console.log('[IMAP] Connection ended');
            clearTimeout(connectionTimeout);
        });

        try {
            console.log('[IMAP] Attempting to connect...');
            imap.connect();
        } catch (err) {
            console.error('[IMAP] Connection error:', err);
            clearTimeout(connectionTimeout);
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

router.post('/redirect', authProvider.handleRedirect(), (req, res) => {
    console.log('OAuth redirect - setting session data');
    console.log('Account data:', req.session.account);
    
    // Zet de sessie data na succesvolle OAuth
    req.session.isAuthenticated = true;
    req.session.method = 'outlook';
    
    // Save the session explicitly
    req.session.save((err) => {
        if (err) {
            console.error('Session save error in OAuth redirect:', err);
            return res.status(500).json({ error: 'Session save failed' });
        }
        console.log('Session saved successfully in OAuth redirect');
        console.log('Session data after save:', {
            isAuthenticated: req.session.isAuthenticated,
            method: req.session.method,
            sessionID: req.sessionID
        });
        
        // Redirect to frontend dashboard
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    });
});

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

router.get('/redirect', (req, res) => {
    console.log('GET /redirect called - OAuth callback');
    console.log('Query params:', req.query);
    console.log('Session before:', {
        isAuthenticated: req.session.isAuthenticated,
        method: req.session.method,
        sessionID: req.sessionID
    });
    
    // Check if we have account data from OAuth
    if (req.session.account) {
        req.session.isAuthenticated = true;
        req.session.method = 'outlook';
        
        req.session.save((err) => {
            if (err) {
                console.error('Session save error in GET redirect:', err);
                return res.status(500).send('Session save failed');
            }
            console.log('Session saved successfully in GET redirect');
            res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
        });
    } else {
        console.log('No account data found in session');
        res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }
});

module.exports = router;