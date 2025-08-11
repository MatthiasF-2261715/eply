function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/outlook-login');
    }
    next();
}

module.exports = { isAuthenticated };