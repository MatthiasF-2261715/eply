const express = require('express');
const { createUser, validateUser, isUserWhitelisted, deleteSession } = require('../database');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
  }

  try {
    const userId = await validateUser(email, password);
    
    if (!userId) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }

    // Set session
    req.session.userId = userId;
    req.session.email = email;
    req.session.isAuthenticated = true;
    req.session.method = 'local';

    await req.session.save();
    res.json({ success: true });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }

  try {
    // Check if user is whitelisted
    const whitelisted = await isUserWhitelisted(email);
    if (!whitelisted) {
      return res.status(403).json({ 
        error: 'Geen toegang. Neem contact op met de beheerder.',
        redirectUrl: '/#contact'
      });
    }

    // Create user
    const userId = await createUser(firstName, lastName, email, password);

    // Set session
    req.session.userId = userId;
    req.session.email = email;
    req.session.isAuthenticated = true;
    req.session.method = 'local';

    await req.session.save();
    res.json({ success: true });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email is al in gebruik' });
    } else {
      res.status(500).json({ error: 'Er is een fout opgetreden' });
    }
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  if (req.session.id && process.env.NODE_ENV === 'production') {
    await deleteSession(req.session.id);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Er is een fout opgetreden' });
    }
    res.json({ success: true, redirectUrl: process.env.FRONTEND_URL });
  });
});

module.exports = router;

