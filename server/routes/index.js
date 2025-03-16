const express = require('express');
const { google } = require('googleapis');
const EventLog = require('../src/models/eventLogModel');
const { checkAuth, oauth2Client } = require('./auth');

const router = express.Router();

// Create YouTube API Instance
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

// Log Events
const logEvent = async (eventType, details) => {
  try {
    await EventLog.create({ eventType, details });
  } catch (error) {
    console.error('Error logging event:', error.message);
  }
};

// Get Video Details
router.get('/api/video/:videoId', checkAuth, async (req, res) => {
  try {
    const { data } = await youtube.videos.list({
      part: 'snippet',
      id: req.params.videoId,
    });
    await logEvent('VIDEO_FETCH', { videoId: req.params.videoId });
    res.json(data.items[0] || {});
  } catch (error) {
    console.error('Error fetching video:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add Comment
router.post('/api/comment/:videoId', checkAuth, async (req, res) => {
  try {
    const { comment } = req.body;
    const { data } = await youtube.commentThreads.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          videoId: req.params.videoId,
          topLevelComment: { snippet: { textOriginal: comment } },
        },
      },
    });
    await logEvent('COMMENT_ADD', { videoId: req.params.videoId, comment });
    res.json(data);
  } catch (error) {
    console.error('Error adding comment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update Video Title
router.put('/api/video/:videoId', checkAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const { data } = await youtube.videos.update({
      part: 'snippet',
      requestBody: {
        id: req.params.videoId,
        snippet: { title, categoryId: '22' }, // People & Blogs category
      },
    });
    await logEvent('TITLE_UPDATE', { videoId: req.params.videoId, newTitle: title });
    res.json(data);
  } catch (error) {
    console.error('Error updating title:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete Comment
router.delete('/api/comment/:commentId', checkAuth, async (req, res) => {
  try {
    await youtube.comments.delete({ id: req.params.commentId });
    await logEvent('COMMENT_DELETE', { commentId: req.params.commentId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;