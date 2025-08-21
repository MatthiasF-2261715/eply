function isAuthenticated(req, res, next) {
    console.log("=== REQUEST DEBUG ===");
    console.log("Session ID:", req.sessionID);
    console.log("Cookie header:", req.headers.cookie);
    console.log("User-Agent:", req.headers['user-agent']);
    console.log("Origin:", req.headers.origin);
    console.log("Referer:", req.headers.referer);
    console.log("CORS Origin check:", process.env.FRONTEND_URL);
    console.log("Is authenticated:", req.session.isAuthenticated);
    console.log("Session method:", req.session.method);
    console.log("====================");
    
    if (!req.session.isAuthenticated) {
        console.log("Not authenticated, redirecting...");
        return res.redirect('/auth/outlook-login');
    }
    
    console.log("Authentication check passed, continuing...");
    next();
}

module.exports = { isAuthenticated };