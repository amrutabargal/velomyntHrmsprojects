const express = require('express');
const router = express.Router();
const TimeSession = require('../models/TimeSession');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Start a time session (manual or called by frontend after login)
router.post('/start', auth, async (req, res) => {
  try {
    const { source = 'auto', device } = req.body;

    // Idempotent start: avoid duplicate active sessions
    const activeSession = await TimeSession.findOne({ user: req.user.id, endAt: null }).sort({ startAt: -1 });
    if (activeSession) {
      return res.status(200).json({ message: 'Time session already active', session: activeSession });
    }

    const session = new TimeSession({
      user: req.user.id,
      startAt: new Date(),
      source,
      meta: { ip: req.ip, device: device || req.headers['user-agent'] }
    });

    await session.save();

    res.status(201).json({ message: 'Time session started', session });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error starting session' });
  }
});

// Stop current active session (server will pick the latest open session)
router.post('/stop', auth, async (req, res) => {
  try {
    // Find latest active session for user
    const session = await TimeSession.findOne({ user: req.user.id, endAt: null }).sort({ startAt: -1 });
    if (!session) {
      return res.status(404).json({ message: 'No active time session found' });
    }

    session.endAt = new Date();
    await session.save();

    res.json({ message: 'Time session stopped', session });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error stopping session' });
  }
});

// Get live session (if any)
router.get('/live', auth, async (req, res) => {
  try {
    const session = await TimeSession.findOne({ user: req.user.id, endAt: null }).sort({ startAt: -1 });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching live session' });
  }
});

// Get daily sessions and total time for a date
router.get('/daily', auth, async (req, res) => {
  try {
    const { date } = req.query; // expected yyyy-mm-dd
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(target.getDate() + 1);

    const sessions = await TimeSession.find({
      user: req.user.id,
      startAt: { $gte: target, $lt: next }
    }).sort({ startAt: 1 });

    // Compute total seconds
    let totalSeconds = 0;
    sessions.forEach(s => {
      const end = s.endAt ? new Date(s.endAt) : new Date();
      totalSeconds += (end - new Date(s.startAt)) / 1000;
    });

    res.json({ date: target.toISOString().slice(0,10), totalSeconds, sessions });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching daily sessions' });
  }
});

module.exports = router;
