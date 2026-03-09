const express = require('express');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');
const { ensureBirthdayNotificationsForToday, broadcastNotification } = require('../utils/notificationService');
const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    await ensureBirthdayNotificationsForToday();
    const { unread_only } = req.query;
    let query = { user: req.user.id };

    if (unread_only === 'true') {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching notifications' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    await ensureBirthdayNotificationsForToday();
    const count = await Notification.countDocuments({
      user: req.user.id,
      is_read: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching unread count' });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Broadcast company/leave notifications
// @access  Private (Admin/Subadmin)
router.post('/broadcast', auth, authorize('admin', 'subadmin'), async (req, res) => {
  try {
    const { type = 'company_announcement', title, message } = req.body;
    const allowedTypes = ['company_announcement', 'leave_announcement', 'system_alert'];
    const recipientRoles = ['admin', 'subadmin', 'hr', 'manager', 'employee'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const sentCount = await broadcastNotification({
      senderRole: req.user.role,
      type,
      title: String(title).trim(),
      message: String(message).trim(),
      recipientRoles,
      senderId: req.user.id,
    });

    res.status(201).json({ message: 'Notification broadcasted to all users successfully', sentCount });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error broadcasting notification' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating notification' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, is_read: false },
      { is_read: true, read_at: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating notifications' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error deleting notification' });
  }
});

module.exports = router;

