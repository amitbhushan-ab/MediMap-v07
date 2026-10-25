const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/notifications/:type/:id
// Get notifications for a user, admin, or pharmacist
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    if (!['user', 'pharmacist', 'admin'].includes(type)) {
      return res.status(400).json({ error: 'Invalid recipient type' });
    }

    const notifications = await Notification.find({ recipientType: type, recipientId: id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications
// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { recipientType, recipientId, type, title, message, submissionId, submissionData } = req.body;
    
    if (!recipientType || !recipientId || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newNotification = new Notification({
      recipientType,
      recipientId,
      type,
      title,
      message,
      submissionId,
      submissionData
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/:id/read
// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/read-all/:type/:id
// Mark all as read for a specific recipient
router.put('/read-all/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    await Notification.updateMany(
      { recipientType: type, recipientId: id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
