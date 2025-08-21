function isAuthenticated(req, res, next) {
  if (!req.session.isAuthenticated) {
    // For fetch/XHR, return 401 JSON so the frontend can handle it
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ error: 'Niet ingelogd.' });
    }
    return res.redirect('/auth/outlook-login');
  }
  next();
}

module.exports = { isAuthenticated };