const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getUserById } = require('../database');

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

module.exports = router;