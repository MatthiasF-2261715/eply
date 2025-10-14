function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        console.log("Not authenticated");
        return res.status(401).json({ 
            error: 'Niet ingelogd',
            redirectUrl: process.env.FRONTEND_URL
        });
    }
    
    // Check session expiry (optional)
    if (req.session.cookie && req.session.cookie.expires && new Date() > req.session.cookie.expires) {
        return res.status(401).json({ 
            error: 'Sessie verlopen',
            redirectUrl: process.env.FRONTEND_URL
        });
    }

    console.log("Authentication check passed");
    next();
}

module.exports = { isAuthenticated };