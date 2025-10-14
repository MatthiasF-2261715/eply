const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { saveImapSettings } = require('../database');

router.post('/new_email', isAuthenticated, async function (req, res, next) {
    try {
        const { server, port, email, password } = req.body;
        
        // Validate required fields
        if (!server || !port || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Save IMAP settings using database function
        await saveImapSettings(server, port, email, password, req.userId);

        res.status(201).json({ message: 'IMAP settings saved successfully' });
    } catch (error) {
        console.error('Error saving IMAP settings:', error);
        res.status(500).json({ error: 'Failed to save IMAP settings' });
    }
});

router.get('/get_emails', isAuthenticated, async function (req, res, next) {
    try {
        const emails = await getUserEmails(req.userId);
        res.json({ emails });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});


module.exports = router;