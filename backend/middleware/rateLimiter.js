const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Verhoogd naar 15 voor Outlook OAuth flow
    message: {
        error: 'Te veel inlogpogingen. Probeer het over 15 minuten opnieuw.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for redirect and token endpoints
    skip: (req) => {
        return req.path.includes('/redirect') || req.path.includes('/acquireOutlookToken');
    }
});

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
    authLimiter,
    imapLimiter
};