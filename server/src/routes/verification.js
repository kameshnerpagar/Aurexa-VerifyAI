const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { runDocumentVerification } = require('../services/verificationEngine');
const { runCrossDocumentChecks } = require('../services/crossDocumentEngine');
const { runComplianceEvaluation } = require('../services/complianceEngine');
const { calculateRiskScore } = require('../services/anomalyScorer');
const { logAuditEvent } = require('../services/auditLogger');

// Trigger complete end-to-end verification pipeline on an application
router.post('/run-all/:appId', (req, res) => {
  try {
    const { appId } = req.params;
    const { actor_name = 'Automated Verification Engine', actor_role = 'reviewer' } = req.body;

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // 1. Run verification on each document
    const docs = db.prepare('SELECT id FROM documents WHERE application_id = ?').all(appId);
    const docVerifications = [];
    for (const d of docs) {
      const v = runDocumentVerification(d.id, actor_name);
      docVerifications.push(v);
    }

    // 2. Cross-Document Consistency checks
    const findings = runCrossDocumentChecks(appId);

    // 3. Regulatory Compliance Rules evaluation
    const compliance = runComplianceEvaluation(appId);

    // 4. Anomaly and Risk Score
    const risk = calculateRiskScore(appId);

    // 5. Update application status if it was 'Draft' or 'Submitted'
    if (app.overall_status === 'Submitted') {
      let nextStatus = 'Under Preliminary Validation';
      if (findings.length > 0) {
        nextStatus = 'Deficiencies Flagged';
      } else if (risk.score === 0) {
        nextStatus = 'Ready for Official Decision';
      }
      db.prepare('UPDATE applications SET overall_status = ?, last_updated = datetime(\'now\') WHERE id = ?').run(nextStatus, appId);
    }

    logAuditEvent({
      actor_name,
      actor_role,
      application_id: appId,
      action: 'FULL_VALIDATION_PIPELINE_EXECUTED',
      target_type: 'Application',
      target_ref: appId,
      outcome: 'Success',
      details: {
        documents_processed: docs.length,
        discrepancies_found: findings.length,
        compliance_summary: compliance.summary,
        risk_score: risk.score,
        risk_level: risk.level
      }
    });

    res.json({
      success: true,
      message: 'Full verification pipeline completed successfully',
      applicationId: appId,
      documentsProcessed: docs.length,
      findingsCount: findings.length,
      complianceSummary: compliance.summary,
      riskScore: risk.score,
      riskLevel: risk.level
    });
  } catch (err) {
    console.error('[Run All Verification Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single document verification trigger
router.post('/document/:docId', (req, res) => {
  try {
    const { docId } = req.params;
    const { actor_name = 'Automated Verification Engine' } = req.body;

    const result = runDocumentVerification(docId, actor_name);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get synthetic issuer registry entries
router.get('/mock-registry', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM mock_issuer_registry').all();
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
