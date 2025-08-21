function isAuthenticated(req, res, next) {
    console.log("Session ID:", req.sessionID);
    console.log("Is authenticated:", req.session.isAuthenticated);
    console.log("Session method:", req.session.method);
    
    if (!req.session.isAuthenticated) {
        console.log("Not authenticated, redirecting...");
        return res.redirect('/auth/outlook-login');
    }
    
    console.log("Authentication check passed, continuing...");
    next();
}

module.exports = { isAuthenticated };