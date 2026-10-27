const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { logAuditEvent } = require('../services/auditLogger');
const { runComplianceEvaluation } = require('../services/complianceEngine');
const { calculateRiskScore } = require('../services/anomalyScorer');

// List all compliance rules
router.get('/rules', (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM compliance_rules ORDER BY rule_code ASC').all().map(r => ({
      ...r,
      applicable_categories: JSON.parse(r.applicable_categories_json),
      rule_logic: JSON.parse(r.rule_logic_json)
    }));
    res.json({ success: true, rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle rule enabled/disabled
router.patch('/rules/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const { actor_name = 'Dr. Vikramaditya Sen', actor_role = 'admin' } = req.body;

    const rule = db.prepare('SELECT * FROM compliance_rules WHERE id = ?').get(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const newState = rule.is_enabled === 1 ? 0 : 1;
    db.prepare('UPDATE compliance_rules SET is_enabled = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newState, id);

    logAuditEvent({
      actor_name,
      actor_role,
      action: 'COMPLIANCE_RULE_TOGGLED',
      target_type: 'ComplianceRule',
      target_ref: rule.rule_code,
      outcome: newState === 1 ? 'Enabled' : 'Disabled',
      details: { rule_code: rule.rule_code, new_state: newState }
    });

    res.json({
      success: true,
      message: `Rule ${rule.rule_code} is now ${newState === 1 ? 'Enabled' : 'Disabled'}`,
      is_enabled: newState
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new compliance rule
router.post('/rules', (req, res) => {
  try {
    const {
      rule_code,
      name,
      description,
      applicable_categories = [],
      requirement_type = 'Document Mandatory',
      rule_logic = {},
      severity = 'Major',
      aicte_handbook_ref = '',
      effective_date = '2026-01-01',
      actor_name = 'Dr. Vikramaditya Sen',
      actor_role = 'admin'
    } = req.body;

    if (!rule_code || !name) {
      return res.status(400).json({ success: false, message: 'rule_code and name are required' });
    }

    const id = `rule-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO compliance_rules (
        id, rule_code, name, description, applicable_categories_json,
        requirement_type, rule_logic_json, severity, aicte_handbook_ref,
        version, is_enabled, effective_date, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, datetime('now'))
    `).run(
      id,
      rule_code,
      name,
      description || '',
      JSON.stringify(applicable_categories),
      requirement_type,
      JSON.stringify(rule_logic),
      severity,
      aicte_handbook_ref,
      effective_date
    );

    logAuditEvent({
      actor_name,
      actor_role,
      action: 'COMPLIANCE_RULE_CREATED',
      target_type: 'ComplianceRule',
      target_ref: rule_code,
      outcome: 'Success',
      details: { rule_code, name, severity, aicte_handbook_ref }
    });

    res.json({
      success: true,
      message: 'New compliance rule created',
      rule: { id, rule_code, name, version: 1 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Edit compliance rule (increments version)
router.put('/rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      applicable_categories = [],
      requirement_type,
      rule_logic = {},
      severity,
      aicte_handbook_ref,
      actor_name = 'Dr. Vikramaditya Sen',
      actor_role = 'admin'
    } = req.body;

    const rule = db.prepare('SELECT * FROM compliance_rules WHERE id = ?').get(id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const newVersion = rule.version + 1;
    db.prepare(`
      UPDATE compliance_rules
      SET name = ?, description = ?, applicable_categories_json = ?,
          requirement_type = ?, rule_logic_json = ?, severity = ?,
          aicte_handbook_ref = ?, version = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || rule.name,
      description !== undefined ? description : rule.description,
      JSON.stringify(applicable_categories),
      requirement_type || rule.requirement_type,
      JSON.stringify(rule_logic),
      severity || rule.severity,
      aicte_handbook_ref || rule.aicte_handbook_ref,
      newVersion,
      id
    );

    logAuditEvent({
      actor_name,
      actor_role,
      action: 'COMPLIANCE_RULE_UPDATED',
      target_type: 'ComplianceRule',
      target_ref: rule.rule_code,
      outcome: 'Success',
      details: { previous_version: rule.version, new_version: newVersion }
    });

    res.json({
      success: true,
      message: `Rule updated to version ${newVersion}`,
      version: newVersion
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Re-evaluate compliance for application
router.post('/evaluate/:appId', (req, res) => {
  try {
    const { appId } = req.params;
    const evalResult = runComplianceEvaluation(appId);
    calculateRiskScore(appId);

    res.json({
      success: true,
      result: evalResult
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
