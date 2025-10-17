const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getUserSignature, saveUserSignature } = require('../database');

// GET: Haal handtekening op
router.get('/signature', isAuthenticated, async (req, res) => {
  try {
    const signature = await getUserSignature(req.session.userId);
    res.json({ signature });
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({ error: 'Failed to fetch signature' });
  }
});

// POST: Sla handtekening op / update
router.post('/signature', isAuthenticated, async (req, res) => {
  try {
    const { signature } = req.body;
    if (typeof signature !== 'string') {
      return res.status(400).json({ error: 'Signature is required' });
    }
    await saveUserSignature(req.session.userId, signature);
    res.json({ message: 'Signature saved' });
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).json({ error: 'Failed to save signature' });
  }
});

module.exports = router;