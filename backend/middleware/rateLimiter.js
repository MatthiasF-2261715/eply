const rateLimit = require('express-rate-limit');

const imapLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Stricter limit for IMAP - 3 attempts per 15 minutes
    message: {
        error: 'Te veel IMAP inlogpogingen. Probeer het over 15 minuten opnieuw.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    imapLimiter
};