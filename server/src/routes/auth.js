const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { logAuditEvent } = require('../services/auditLogger');

// List demo users
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT u.*, i.name as institution_name FROM users u LEFT JOIN institutions i ON u.institution_id = i.id').all();
  res.json({ success: true, users });
});

// Demo login by email or role
router.post('/login', (req, res) => {
  const { role, email } = req.body;
  let user = null;

  if (email) {
    user = db.prepare('SELECT u.*, i.name as institution_name, i.current_pid FROM users u LEFT JOIN institutions i ON u.institution_id = i.id WHERE u.email = ?').get(email);
  } else if (role) {
    user = db.prepare('SELECT u.*, i.name as institution_name, i.current_pid FROM users u LEFT JOIN institutions i ON u.institution_id = i.id WHERE u.role = ?').get(role);
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or demo role' });
  }

  logAuditEvent({
    actor_name: user.name,
    actor_role: user.role,
    action: 'USER_LOGIN',
    target_type: 'Session',
    target_ref: user.id,
    outcome: 'Success',
    details: { role: user.role, email: user.email }
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
      institution_name: user.institution_name,
      current_pid: user.current_pid,
      designation: user.designation,
      avatar: user.avatar
    },
    token: `demo-token-${user.id}-${Date.now()}`
  });
});

module.exports = router;
