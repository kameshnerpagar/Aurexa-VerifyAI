const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { logAuditEvent } = require('../services/auditLogger');
const { calculateRiskScore } = require('../services/anomalyScorer');

// Update finding disposition (Confirm Discrepancy, Dismiss False Positive, etc.)
router.post('/findings/:findingId/disposition', (req, res) => {
  try {
    const { findingId } = req.params;
    const {
      disposition, // 'Confirmed Discrepancy', 'Dismissed False Positive', 'Requested Evidence', 'Resolved'
      reason,
      actor_name = 'Smt. Anita Deshmukh',
      actor_role = 'reviewer'
    } = req.body;

    if (!disposition) {
      return res.status(400).json({ success: false, message: 'disposition is required' });
    }

    if (disposition === 'Dismissed False Positive' && (!reason || reason.trim().length < 5)) {
      return res.status(400).json({
        success: false,
        message: 'A detailed justification reason is mandatory when dismissing a finding as a false positive.'
      });
    }

    const finding = db.prepare('SELECT * FROM cross_document_findings WHERE id = ?').get(findingId);
    if (!finding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    db.prepare(`
      UPDATE cross_document_findings
      SET reviewer_disposition = ?, disposition_reason = ?, disposition_by = ?, disposition_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(disposition, reason || '', actor_name, findingId);

    // Re-calculate application risk score
    calculateRiskScore(finding.application_id);

    // Log audit event
    logAuditEvent({
      actor_name,
      actor_role,
      application_id: finding.application_id,
      action: 'FINDING_DISPOSITION_RECORDED',
      target_type: 'CrossDocumentFinding',
      target_ref: findingId,
      outcome: disposition,
      details: {
        finding_code: finding.finding_code,
        finding_type: finding.finding_type,
        disposition,
        reason
      }
    });

    res.json({
      success: true,
      message: `Finding marked as ${disposition}`,
      findingId,
      disposition
    });
  } catch (err) {
    console.error('[Finding Disposition Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reviewer application level actions
router.post('/applications/:appId/action', (req, res) => {
  try {
    const { appId } = req.params;
    const {
      action_type, // 'ASSIGN_REVIEWER', 'REQUEST_EVIDENCE', 'RETURN_FOR_CORRECTION', 'RECOMMEND_INSPECTION', 'RECOMMEND_SCRUTINY', 'MARK_READY_FOR_DECISION', 'ADD_NOTE'
      reviewer_id,
      reviewer_name,
      notes,
      actor_name = 'Smt. Anita Deshmukh',
      actor_role = 'reviewer'
    } = req.body;

    const app = db.prepare('SELECT a.*, i.name as institution_name FROM applications a JOIN institutions i ON a.institution_id = i.id WHERE a.id = ?').get(appId);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let newStatus = app.overall_status;
    let notifTitle = '';
    let notifMsg = '';
    let notifRole = 'applicant';

    switch (action_type) {
      case 'ASSIGN_REVIEWER':
        db.prepare('UPDATE applications SET assigned_reviewer_id = ?, assigned_reviewer_name = ?, last_updated = datetime(\'now\') WHERE id = ?')
          .run(reviewer_id, reviewer_name, appId);
        break;

      case 'REQUEST_EVIDENCE':
        newStatus = 'Deficiencies Flagged';
        db.prepare('UPDATE applications SET overall_status = ?, last_updated = datetime(\'now\') WHERE id = ?').run(newStatus, appId);
        notifTitle = 'Additional Evidence Requested';
        notifMsg = `AICTE Reviewer has requested additional evidence for ${appId}: ${notes || 'Please review deficiencies in your application portal.'}`;
        break;

      case 'RETURN_FOR_CORRECTION':
        newStatus = 'Returned for Correction';
        db.prepare('UPDATE applications SET overall_status = ?, last_updated = datetime(\'now\') WHERE id = ?').run(newStatus, appId);
        notifTitle = 'Application Returned for Correction';
        notifMsg = `Application ${appId} returned for institutional corrections: ${notes || 'Rectify flagged deficiencies before resubmission.'}`;
        break;

      case 'RECOMMEND_INSPECTION':
        newStatus = 'Inspection Recommended';
        db.prepare('UPDATE applications SET overall_status = ?, last_updated = datetime(\'now\') WHERE id = ?').run(newStatus, appId);
        notifTitle = 'Physical Inspection Recommended';
        notifMsg = `Application ${appId} routed to Regional Expert Visit Committee for physical campus verification.`;
        notifRole = 'reviewer';
        break;

      case 'RECOMMEND_SCRUTINY':
        newStatus = 'Manual Review Required';
        db.prepare('UPDATE applications SET overall_status = ?, last_updated = datetime(\'now\') WHERE id = ?').run(newStatus, appId);
        break;

      case 'MARK_READY_FOR_DECISION':
        newStatus = 'Ready for Official Decision';
        db.prepare('UPDATE applications SET overall_status = ?, last_updated = datetime(\'now\') WHERE id = ?').run(newStatus, appId);
        notifTitle = 'Application Ready for Official Review';
        notifMsg = `Preliminary validation complete for ${appId}. Ready for Regional Committee consideration.`;
        notifRole = 'reviewer';
        break;

      case 'ADD_NOTE':
        // Notes stored in audit log and details table
        if (notes) {
          db.prepare('UPDATE application_details SET additional_notes = ? WHERE application_id = ?').run(notes, appId);
        }
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown action_type: ${action_type}` });
    }

    // In-app notification creation
    if (notifTitle) {
      db.prepare(`
        INSERT INTO notifications (id, user_role, title, message, application_id, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 'info', 0, datetime('now'))
      `).run(`notif-${uuidv4().slice(0, 8)}`, notifRole, notifTitle, notifMsg, appId);
    }

    // Append to audit trail
    logAuditEvent({
      actor_name,
      actor_role,
      application_id: appId,
      action: action_type,
      target_type: 'Application',
      target_ref: appId,
      outcome: 'Success',
      details: { new_status: newStatus, notes, assigned_to: reviewer_name }
    });

    res.json({
      success: true,
      message: `Action "${action_type}" executed successfully`,
      newStatus
    });
  } catch (err) {
    console.error('[Reviewer Action Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
