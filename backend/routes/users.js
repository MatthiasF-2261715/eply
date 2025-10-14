const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getUserById, deleteSession } = require('../database');

router.get('/profile', isAuthenticated, async function (req, res, next) {
    try {
        const user = await getUserById(req.session.userId);
        res.json({
            email: user.email,
            firstName: user.first,
            lastName: user.last
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        if (error.message && error.message.includes('401')) {
            return res.status(401).json({ error: 'Access token expired or invalid' });
        }
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

router.post('/logout', isAuthenticated, async function (req, res, next) {
    try {
        // Delete the session from the database
        await deleteSession(req.sessionID);

        // Destroy the session
        req.session.destroy(err => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Error logging out' });
            }
            
            // Clear the session cookie
            res.clearCookie('connect.sid');
            
            // Send success response
            res.json({ message: 'Successfully logged out' });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Error during logout' });
    }
});

module.exports = router;