const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { logAuditEvent } = require('../services/auditLogger');
const { calculateRiskScore } = require('../services/anomalyScorer');
const { runComplianceEvaluation } = require('../services/complianceEngine');

// List infrastructure evidence
router.get('/', (req, res) => {
  try {
    const { application_id, category, review_status } = req.query;
    let query = `
      SELECT inf.*, a.category as application_category, i.name as institution_name
      FROM infrastructure_evidence inf
      JOIN applications a ON inf.application_id = a.id
      JOIN institutions i ON a.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (application_id) {
      query += ' AND inf.application_id = ?';
      params.push(application_id);
    }
    if (category) {
      query += ' AND inf.category = ?';
      params.push(category);
    }
    if (review_status) {
      query += ' AND inf.review_status = ?';
      params.push(review_status);
    }

    query += ' ORDER BY inf.created_at DESC';
    const items = db.prepare(query).all(...params).map(inf => ({
      ...inf,
      detected_elements: inf.detected_elements_json ? JSON.parse(inf.detected_elements_json) : []
    }));

    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update review status for infrastructure evidence
router.put('/:id/review', (req, res) => {
  try {
    const { id } = req.params;
    const {
      review_status, // 'Verified', 'Potential Discrepancy', 'Needs Physical Inspection'
      reviewer_notes,
      actor_name = 'Smt. Anita Deshmukh',
      actor_role = 'reviewer'
    } = req.body;

    const item = db.prepare('SELECT * FROM infrastructure_evidence WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Infrastructure item not found' });
    }

    db.prepare(`
      UPDATE infrastructure_evidence
      SET review_status = ?, reviewer_notes = ?
      WHERE id = ?
    `).run(review_status, reviewer_notes || item.reviewer_notes, id);

    // Re-evaluate compliance rule 8 and risk score
    runComplianceEvaluation(item.application_id);
    calculateRiskScore(item.application_id);

    logAuditEvent({
      actor_name,
      actor_role,
      application_id: item.application_id,
      action: 'INFRASTRUCTURE_REVIEWED',
      target_type: 'InfrastructureEvidence',
      target_ref: id,
      outcome: review_status,
      details: {
        item_title: item.title,
        review_status,
        reviewer_notes
      }
    });

    res.json({
      success: true,
      message: `Infrastructure status updated to ${review_status}`,
      review_status
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
