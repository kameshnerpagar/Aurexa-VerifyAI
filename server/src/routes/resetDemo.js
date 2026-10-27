const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../seed');
const { logAuditEvent } = require('../services/auditLogger');

router.post('/', (req, res) => {
  try {
    const { actor_name = 'Administrator', actor_role = 'admin' } = req.body;

    seedDatabase();

    logAuditEvent({
      actor_name,
      actor_role,
      action: 'DEMO_DATASET_RESET',
      target_type: 'System',
      target_ref: 'ALL_TABLES',
      outcome: 'Success',
      details: {
        note: 'Restored pristine SIH 2026 judging demonstration dataset (8 institutions, 12 applications, rules, and mock registries).'
      }
    });

    res.json({
      success: true,
      message: 'Demo dataset reset successfully! All 8 institutions, 12 benchmark applications, compliance rules, and mock registries are restored.'
    });
  } catch (err) {
    console.error('[Reset Demo Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
