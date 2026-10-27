const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { logAuditEvent } = require('../services/auditLogger');
const { runCrossDocumentChecks } = require('../services/crossDocumentEngine');
const { runComplianceEvaluation } = require('../services/complianceEngine');
const { calculateRiskScore } = require('../services/anomalyScorer');

// Dashboard statistics derived directly from live database
router.get('/stats', (req, res) => {
  try {
    const totalApps = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const awaitingReview = db.prepare("SELECT COUNT(*) as count FROM applications WHERE overall_status IN ('Submitted', 'Under Preliminary Validation')").get().count;
    const missingDocs = db.prepare('SELECT COUNT(*) as count FROM applications WHERE missing_doc_count > 0').get().count;
    const manualVerify = db.prepare("SELECT COUNT(*) as count FROM applications WHERE overall_status = 'Manual Review Required'").get().count;
    const readyOfficial = db.prepare("SELECT COUNT(*) as count FROM applications WHERE overall_status = 'Ready for Official Decision'").get().count;
    const openDeficiencies = db.prepare(`
      SELECT COUNT(*) as count FROM cross_document_findings
      WHERE reviewer_disposition IN ('Unreviewed', 'Confirmed Discrepancy')
    `).get().count;

    // Status distribution
    const statusRows = db.prepare(`
      SELECT overall_status as name, COUNT(*) as value
      FROM applications GROUP BY overall_status
    `).all();

    // Risk distribution
    const riskRows = db.prepare(`
      SELECT risk_level as name, COUNT(*) as value
      FROM applications GROUP BY risk_level
    `).all();

    // Category distribution
    const categoryRows = db.prepare(`
      SELECT category as name, COUNT(*) as count
      FROM applications GROUP BY category
    `).all();

    // Document verification breakdown
    const docStatusRows = db.prepare(`
      SELECT status as name, COUNT(*) as count
      FROM documents GROUP BY status
    `).all();

    // Recent activity (latest 8 audit logs)
    const recentActivity = db.prepare(`
      SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 8
    `).all().map(r => ({ ...r, details: r.details_json ? JSON.parse(r.details_json) : {} }));

    // High priority review queue (applications needing immediate attention)
    const priorityQueue = db.prepare(`
      SELECT a.*, i.name as institution_name
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      WHERE a.risk_score >= 50 OR a.overall_status IN ('Manual Review Required', 'Deficiencies Flagged', 'Inspection Recommended')
      ORDER BY a.risk_score DESC, a.last_updated DESC
      LIMIT 6
    `).all();

    res.json({
      success: true,
      stats: {
        totalApplications: totalApps,
        awaitingReview,
        missingDocuments: missingDocs,
        manualVerificationRequired: manualVerify,
        readyForOfficialReview: readyOfficial,
        openComplianceDeficiencies: openDeficiencies
      },
      charts: {
        statusDistribution: statusRows,
        riskDistribution: riskRows,
        categoryBreakdown: categoryRows,
        documentStatus: docStatusRows
      },
      recentActivity,
      priorityQueue
    });
  } catch (err) {
    console.error('[Stats Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// List applications with search, filter, sort, pagination
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      status,
      risk_level,
      academic_year,
      reviewer_id,
      page = 1,
      limit = 10,
      sort_by = 'last_updated',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT a.*, i.name as institution_name, i.current_pid, i.state, i.district, i.type as institution_type
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (a.id LIKE ? OR i.name LIKE ? OR i.current_pid LIKE ? OR a.category LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (category && category !== 'All') {
      query += ` AND a.category = ?`;
      params.push(category);
    }
    if (status && status !== 'All') {
      query += ` AND a.overall_status = ?`;
      params.push(status);
    }
    if (risk_level && risk_level !== 'All') {
      query += ` AND a.risk_level = ?`;
      params.push(risk_level);
    }
    if (academic_year && academic_year !== 'All') {
      query += ` AND a.academic_year = ?`;
      params.push(academic_year);
    }
    if (reviewer_id) {
      query += ` AND a.assigned_reviewer_id = ?`;
      params.push(reviewer_id);
    }

    // Count total matching
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = db.prepare(countQuery).get(...params).total;

    // Sorting
    const safeSortCols = ['id', 'institution_name', 'category', 'academic_year', 'submission_date', 'overall_status', 'risk_score', 'last_updated'];
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const sortByCol = safeSortCols.includes(sort_by) ? sort_by : 'last_updated';

    query += ` ORDER BY ${sortByCol === 'institution_name' ? 'i.name' : 'a.' + sortByCol} ${safeSortOrder}`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const applications = db.prepare(query).all(...params);

    res.json({
      success: true,
      applications,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (err) {
    console.error('[Applications List Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Single application detail
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const app = db.prepare(`
      SELECT a.*, i.name as institution_name, i.current_pid, i.state, i.district, i.address, i.pin_code,
             i.contact_person, i.email as institution_email, i.phone as institution_phone, i.established_year, i.type as institution_type
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      WHERE a.id = ?
    `).get(id);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const details = db.prepare('SELECT * FROM application_details WHERE application_id = ?').get(id);
    if (details) {
      details.programmes = details.programmes_json ? JSON.parse(details.programmes_json) : [];
      details.proposed_intake = details.proposed_intake_json ? JSON.parse(details.proposed_intake_json) : {};
    }

    const docs = db.prepare('SELECT * FROM documents WHERE application_id = ? ORDER BY upload_date DESC').all(id);

    // Attach extractions and verification records to each doc
    for (const d of docs) {
      d.extractions = db.prepare('SELECT * FROM document_extractions WHERE document_id = ?').all(d.id);
      d.verification_records = db.prepare('SELECT * FROM verification_records WHERE document_id = ?').all(d.id).map(vr => ({
        ...vr,
        details: vr.details_json ? JSON.parse(vr.details_json) : {}
      }));
    }

    const findings = db.prepare('SELECT * FROM cross_document_findings WHERE application_id = ? ORDER BY severity DESC, created_at DESC').all(id);
    const evaluations = db.prepare(`
      SELECT e.*, r.rule_code, r.name as rule_name, r.severity as rule_severity, r.aicte_handbook_ref, r.requirement_type
      FROM compliance_evaluations e
      JOIN compliance_rules r ON e.rule_id = r.id
      WHERE e.application_id = ?
      ORDER BY r.rule_code ASC
    `).all(id);

    const infrastructure = db.prepare('SELECT * FROM infrastructure_evidence WHERE application_id = ? ORDER BY created_at DESC').all(id).map(inf => ({
      ...inf,
      detected_elements: inf.detected_elements_json ? JSON.parse(inf.detected_elements_json) : []
    }));

    const auditTrail = db.prepare('SELECT * FROM audit_events WHERE application_id = ? ORDER BY timestamp DESC').all(id).map(a => ({
      ...a,
      details: a.details_json ? JSON.parse(a.details_json) : {}
    }));

    const riskBreakdown = calculateRiskScore(id);

    res.json({
      success: true,
      application: app,
      details,
      documents: docs,
      findings,
      evaluations,
      infrastructure,
      auditTrail,
      riskBreakdown
    });
  } catch (err) {
    console.error('[Application Detail Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new application (Wizard Step 1-4)
router.post('/', (req, res) => {
  try {
    const {
      institution_id,
      institution_name,
      institution_type,
      state,
      district,
      address,
      pin_code,
      contact_person,
      email,
      phone,
      established_year,
      current_pid,
      category,
      academic_year = '2026-27',
      programmes = [],
      proposed_intake = {},
      previous_approval_ref = '',
      land_area_acres = 0,
      built_up_area_sqm = 0,
      principal_name = '',
      principal_email = '',
      principal_phone = '',
      additional_notes = '',
      is_draft = false,
      actor_name = 'Institution Applicant',
      actor_role = 'applicant'
    } = req.body;

    let instId = institution_id;

    // Check or create institution if new
    if (!instId) {
      instId = `INST-${(state || 'IN').slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      db.prepare(`
        INSERT INTO institutions (
          id, name, type, state, district, address, pin_code, contact_person, email, phone, established_year, current_pid
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        instId,
        institution_name || 'New Technical Institute',
        institution_type || 'Engineering & Technology',
        state || 'Maharashtra',
        district || 'Pune',
        address || 'Survey No. 101, Knowledge Park',
        pin_code || '411001',
        contact_person || actor_name,
        email || 'contact@institute.ac.in',
        phone || '+91 99999 88888',
        Number(established_year) || 2024,
        current_pid || `1-${Math.floor(100000000 + Math.random() * 900000000)}`
      );
    }

    const appId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const overallStatus = is_draft ? 'Draft' : 'Submitted';

    db.prepare(`
      INSERT INTO applications (
        id, institution_id, category, academic_year, submission_date, overall_status,
        risk_score, risk_level, assigned_reviewer_id, assigned_reviewer_name,
        missing_doc_count, discrepancy_count, compliance_status, last_updated
      )
      VALUES (?, ?, ?, ?, datetime('now'), ?, 0, 'Low', NULL, 'Unassigned', 0, 0, 'Pending Initial Evaluation', datetime('now'))
    `).run(appId, instId, category, academic_year, overallStatus);

    db.prepare(`
      INSERT INTO application_details (
        application_id, programmes_json, proposed_intake_json, previous_approval_ref,
        land_area_acres, built_up_area_sqm, principal_name, principal_email, principal_phone, additional_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appId,
      JSON.stringify(programmes),
      JSON.stringify(proposed_intake),
      previous_approval_ref,
      Number(land_area_acres),
      Number(built_up_area_sqm),
      principal_name,
      principal_email,
      principal_phone,
      additional_notes
    );

    // Initial audit log
    logAuditEvent({
      actor_name,
      actor_role,
      application_id: appId,
      action: is_draft ? 'APPLICATION_DRAFT_CREATED' : 'APPLICATION_SUBMITTED',
      target_type: 'Application',
      target_ref: appId,
      outcome: 'Success',
      details: { category, academic_year, institution_id: instId, is_draft }
    });

    // In-app notification for reviewer
    if (!is_draft) {
      db.prepare(`
        INSERT INTO notifications (id, user_role, title, message, application_id, type, is_read, created_at)
        VALUES (?, 'reviewer', 'New Application Submitted', ?, ?, 'info', 0, datetime('now'))
      `).run(
        `notif-${uuidv4().slice(0, 8)}`,
        `Application ${appId} submitted by ${institution_name || 'Institution'} for ${category}.`,
        appId
      );

      // Run preliminary cross checks & compliance
      runCrossDocumentChecks(appId);
      runComplianceEvaluation(appId);
      calculateRiskScore(appId);
    }

    res.json({
      success: true,
      message: is_draft ? 'Application saved as draft' : 'Application submitted successfully',
      applicationId: appId
    });
  } catch (err) {
    console.error('[Create Application Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete draft application
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (app.overall_status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only Draft applications can be removed.' });
    }

    db.prepare('DELETE FROM applications WHERE id = ?').run(id);

    logAuditEvent({
      actor_name: 'Institution Applicant',
      actor_role: 'applicant',
      application_id: id,
      action: 'APPLICATION_DRAFT_DELETED',
      target_type: 'Application',
      target_ref: id,
      outcome: 'Success'
    });

    res.json({ success: true, message: 'Draft deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
