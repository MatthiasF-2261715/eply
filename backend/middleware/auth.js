function isAuthenticated(req, res, next) {
    console.log("Checking session " + req.session.isAuthenticated);
        if (!req.session.isAuthenticated) {
        return res.redirect('/auth/outlook-login');
    }
}

module.exports = { isAuthenticated };