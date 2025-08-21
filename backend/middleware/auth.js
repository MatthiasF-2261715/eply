function isAuthenticated(req, res, next) {
    console.log("Checking session " + req.session);
        if (!req.session.isAuthenticated) {
        return res.redirect('/auth/outlook-login');
    }
    
    // Add this to ensure session is saved
    req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        next();
    });
}

module.exports = { isAuthenticated };