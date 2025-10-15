function isAuthenticated(req, res, next) {
        if (!req.session.isAuthenticated) {
        console.log("Not authenticated, redirecting...");
        return res.redirect('/auth/outlook-login');
    }
    
    console.log("Authentication check passed, continuing...");
    next();
}

module.exports = { isAuthenticated };