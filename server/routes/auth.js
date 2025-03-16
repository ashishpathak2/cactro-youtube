const express = require('express');
const { google } = require('googleapis');
const User = require('../src/models/userModel');

const router = express.Router();

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Generate OAuth URL
router.get('/url', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
  });
  res.json({ url: authUrl });
});

// OAuth Callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error('No authorization code provided');
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens in session
    req.session.tokens = tokens;

    // Store or update user tokens in MongoDB
    const user = await User.findOneAndUpdate(
      { googleId: tokens.id_token },
      { tokens },
      { upsert: true, new: true }
    );

    console.log('User authenticated:', user.googleId);

    // Redirect to frontend after successful authentication
    res.redirect('https://cactro-youtube.onrender.com'); // Adjust to your frontend URL
  } catch (error) {
    console.error('OAuth Error:', error.message);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Middleware to Check Authentication
const checkAuth = async (req, res, next) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
  }

  oauth2Client.setCredentials(req.session.tokens);

  try {
    if (oauth2Client.isTokenExpiring()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      req.session.tokens = credentials;
      await User.findOneAndUpdate(
        { googleId: credentials.id_token },
        { tokens: credentials }
      );
    }
    next();
  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(401).json({ error: 'Authentication expired' });
  }
};

module.exports = { router, checkAuth, oauth2Client };