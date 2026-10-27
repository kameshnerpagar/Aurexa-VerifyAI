const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../services/auditLogger');

router.get('/', (req, res) => {
  try {
    const { application_id, actor_role, action, search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const logs = getAuditLogs({
      application_id,
      actor_role,
      action,
      search,
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      logs,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
