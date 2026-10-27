const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List notifications by role
router.get('/', (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT * FROM notifications';
    const params = [];

    if (role) {
      query += ' WHERE user_role = ? OR user_role = "all"';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC LIMIT 30';

    const notifs = db.prepare(query).all(...params);
    const unreadCount = notifs.filter(n => n.is_read === 0).length;

    res.json({ success: true, notifications: notifs, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark all or single notification as read
router.post('/read', (req, res) => {
  try {
    const { id, role } = req.body;
    if (id) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    } else if (role) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_role = ?').run(role);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1').run();
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
