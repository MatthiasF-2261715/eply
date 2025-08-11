const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getInboxEmails, getSentEmails } = require('../services/emailService');
const { createImapDraft, createOutlookDraft } = require('../services/draftService');
const { getAssistantByEmail } = require('../database');
const { useAssistant } = require('../assistant');
const { extractEmail } = require('../utils/emailTransform');

router.get('/id', isAuthenticated, async (req, res) => {
    res.render('id', { idTokenClaims: req.session.account?.idTokenClaims });
});

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

router.get('/mails', isAuthenticated, async function(req, res, next) {
    if (!req.session.method) {
        return res.status(401).json({ error: 'Niet ingelogd.' });
    }

    try {
        const mails = await getInboxEmails(req.session.method, req.session);
        res.json({ mails });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ai/reply', isAuthenticated, async function (req, res) {
    let { email, content, originalMail } = req.body;
    console.log('AI reply request:', { email, content, originalMail });
    if (!email || !content) {
        return res.status(400).json({ error: 'Email en content zijn verplicht.' });
    }
    email = extractEmail(email);
    console.log('Extracted email:', email);
    try {
        const sentEmails = await getSentEmails(req.session.method, req.session);
        const assistantObj = await getAssistantByEmail(email);
        const assistantId = assistantObj.assistant_id || assistantObj.id;
        
        const currentEmail = { from: email, content };
        const aiResponse = await useAssistant(assistantId, currentEmail, sentEmails);
        
        console.log('AI response generated successfully');
        
        if (originalMail) {
            console.log('Creating draft using method:', req.session.method);
            if (req.session.method === 'imap') {
                await createImapDraft(req.session, aiResponse, originalMail);
                console.log('IMAP draft created successfully');
            } else if (req.session.method === 'outlook') {
                await createOutlookDraft(req.session, aiResponse, originalMail);
                console.log('Outlook draft created successfully');
            }
        }
        
        res.json({ response: aiResponse });
    } catch (err) {
        console.error('Error in /ai/reply:', err);
        res.status(500).json({ error: err.message || 'AI response error' });
    }
});

module.exports = router;