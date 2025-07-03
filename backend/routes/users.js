/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var express = require('express');
var router = express.Router();

var fetch = require('../fetch');

var { GRAPH_ME_ENDPOINT } = require('../authConfig');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/signin'); // redirect to sign-in route
    }

    next();
};

router.get('/id',
    isAuthenticated, // check if user is authenticated
    async function (req, res, next) {
        res.render('id', { idTokenClaims: req.session.account.idTokenClaims });
    }
);

router.get('/profile',
    isAuthenticated,
    async function (req, res, next) {
        try {
            if (!req.session.accessToken) {
                console.error('No access token in session');
                return res.status(401).json({ error: 'No access token in session' });
            }
            const graphResponse = await fetch(GRAPH_ME_ENDPOINT, req.session.accessToken);
            res.json({ 
                profile: graphResponse,
                username: graphResponse.displayName || graphResponse.mail || graphResponse.userPrincipalName
            });
        } catch (error) {
            if (error.message && error.message.includes('401')) {
                // Token verlopen of ongeldig
                return res.status(401).json({ error: 'Access token expired or invalid' });
            }
            console.error('Error fetching profile:', error);
            res.status(500).json({ error: 'Error fetching profile' });
        }
    }
);

router.get('/mails',
    isAuthenticated,
    async function (req, res, next) {
        try {
            if (!req.session.accessToken) {
                console.error('No access token in session');
                return res.status(401).json({ error: 'No access token in session' });
            }
            const mailsEndpoint = 'https://graph.microsoft.com/v1.0/me/messages?$top=10&$orderby=receivedDateTime desc';
            const mailsResponse = await fetch(mailsEndpoint, req.session.accessToken);
            res.json({ mails: mailsResponse.value });
        } catch (error) {
            if (error.status === 401) {
                console.error(error);
                return res.status(401).json({ error: 'Access token expired or invalid' });
            }
            console.error('Error fetching mails:', error);
            res.status(500).json({ error: 'Error fetching mails' });
        }
    }
);

module.exports = router;