const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

function runCrossDocumentChecks(applicationId) {
  const app = db.prepare('SELECT a.*, i.name as institution_name, i.current_pid, i.state FROM applications a JOIN institutions i ON a.institution_id = i.id WHERE a.id = ?').get(applicationId);
  if (!app) {
    throw new Error('Application not found');
  }

  const appDetails = db.prepare('SELECT * FROM application_details WHERE application_id = ?').get(applicationId);
  const docs = db.prepare('SELECT * FROM documents WHERE application_id = ?').all(applicationId);

  // Preserve existing reviewer dispositions for existing findings if they exist
  const existingFindings = db.prepare('SELECT * FROM cross_document_findings WHERE application_id = ?').all(applicationId);
  const dispositionMap = {};
  for (const ef of existingFindings) {
    if (ef.reviewer_disposition !== 'Unreviewed') {
      dispositionMap[ef.finding_code] = ef;
    }
  }

  // Clear unreviewed findings to avoid stale duplication
  db.prepare("DELETE FROM cross_document_findings WHERE application_id = ? AND reviewer_disposition = 'Unreviewed'").run(applicationId);

  const insertFinding = db.prepare(`
    INSERT INTO cross_document_findings (
      id, application_id, finding_code, finding_type, severity,
      source_doc_id, source_doc_name, source_field, target_doc_id, target_doc_name, target_field,
      observed_value, expected_value, explanation, recommended_action,
      reviewer_disposition, disposition_reason, disposition_by, disposition_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const findings = [];

  // Helper to record finding
  function recordFinding({
    code,
    type,
    severity,
    sourceDocId,
    sourceDocName,
    sourceField,
    targetDocId,
    targetDocName,
    targetField,
    observedValue,
    expectedValue,
    explanation,
    recommendedAction
  }) {
    // Check if reviewer previously acted on this code
    const prev = dispositionMap[code];
    const disp = prev ? prev.reviewer_disposition : 'Unreviewed';
    const reason = prev ? prev.disposition_reason : null;
    const by = prev ? prev.disposition_by : null;
    const at = prev ? prev.disposition_at : null;

    const id = prev ? prev.id : `find-${uuidv4().slice(0, 8)}`;

    insertFinding.run(
      id,
      applicationId,
      code,
      type,
      severity,
      sourceDocId,
      sourceDocName,
      sourceField,
      targetDocId,
      targetDocName,
      targetField,
      observedValue,
      expectedValue,
      explanation,
      recommendedAction,
      disp,
      reason,
      by,
      at
    );

    findings.push({
      id,
      code,
      type,
      severity,
      observedValue,
      expectedValue,
      explanation,
      reviewer_disposition: disp
    });
  }

  // Check 1: Duplicate File Hashes (File level)
  const hashMap = {};
  for (const doc of docs) {
    if (hashMap[doc.file_hash_sha256]) {
      const prevDoc = hashMap[doc.file_hash_sha256];
      recordFinding({
        code: `FIND-DUP-${doc.id.slice(-4)}`,
        type: 'Duplicate File Hash',
        severity: 'High',
        sourceDocId: doc.id,
        sourceDocName: doc.file_name,
        sourceField: 'file_hash_sha256',
        targetDocId: prevDoc.id,
        targetDocName: prevDoc.file_name,
        targetField: 'file_hash_sha256',
        observedValue: doc.file_hash_sha256,
        expectedValue: 'Distinct Cryptographic SHA-256 Hash',
        explanation: `Cryptographic SHA-256 hash collision: "${doc.file_name}" uploaded under "${doc.document_type}" is identical to "${prevDoc.file_name}" uploaded under "${prevDoc.document_type}".`,
        recommendedAction: 'Direct applicant to upload the genuine, distinct certificate file rather than duplicated attachments.'
      });
    } else {
      hashMap[doc.file_hash_sha256] = doc;
    }
  }

  // Check 2: Missing Mandatory Documents by Category
  const docTypesPresent = new Set(docs.map(d => d.document_type));
  const category = app.category;
  const mandatoryByType = {
    'Extension of Approval (EOA)': ['AICTE Previous Approval Order', 'Fire Safety NOC'],
    'New Institution Approval': ['Land Ownership / Lease Deed', 'Building Safety Certificate', 'Fire Safety NOC', 'Affiliating University NOC'],
    'Increase in Intake / Additional Course': ['AICTE Previous Approval Order', 'Affiliating University NOC'],
    'Change in Site / Campus': ['Land Ownership / Lease Deed', 'Building Safety Certificate', 'Fire Safety NOC']
  };

  const required = mandatoryByType[category] || ['AICTE Previous Approval Order'];
  const missing = [];
  for (const req of required) {
    if (!docTypesPresent.has(req)) {
      missing.push(req);
      recordFinding({
        code: `FIND-MISS-${req.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`,
        type: 'Missing Mandatory Document',
        severity: 'Critical',
        sourceDocId: null,
        sourceDocName: 'None (Checklist Checklist)',
        sourceField: 'document_checklist',
        targetDocId: null,
        targetDocName: 'AICTE Approval Handbook Norms',
        targetField: 'mandatory_checklist',
        observedValue: `Document Not Uploaded: [${req}]`,
        expectedValue: `Mandatory Upload of [${req}] for category: ${category}`,
        explanation: `Mandatory statutory document "${req}" is absent from the submitted application package.`,
        recommendedAction: 'Issue Deficiency Notice to applicant requesting immediate upload of the missing document.'
      });
    }
  }

  // Update missing doc count in applications table
  db.prepare('UPDATE applications SET missing_doc_count = ? WHERE id = ?').run(missing.length, applicationId);

  // Fetch all extractions for docs of this application
  const extractions = db.prepare(`
    SELECT e.*, d.document_type, d.file_name
    FROM document_extractions e
    JOIN documents d ON e.document_id = d.id
    WHERE d.application_id = ?
  `).all(applicationId);

  // Check 3: Institution Name Consistency
  for (const ext of extractions.filter(e => e.field_name === 'institution_name')) {
    const docNameClean = ext.current_value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const appNameClean = app.institution_name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Allow partial substring match
    if (!docNameClean.includes(appNameClean.slice(0, 15)) && !appNameClean.includes(docNameClean.slice(0, 15))) {
      recordFinding({
        code: `FIND-NAME-${ext.id.slice(-4)}`,
        type: 'Institution Name Mismatch',
        severity: 'High',
        sourceDocId: ext.document_id,
        sourceDocName: ext.file_name,
        sourceField: 'institution_name',
        targetDocId: null,
        targetDocName: 'AICTE Institutional Master Record',
        targetField: 'institution.name',
        observedValue: ext.current_value,
        expectedValue: app.institution_name,
        explanation: `Document extracted name "${ext.current_value}" diverges substantially from registered name "${app.institution_name}".`,
        recommendedAction: 'Verify whether a registered Trust name or old college name is being referenced, or require correction.'
      });
    }
  }

  // Check 4: Permanent Institute ID (PID) Mismatch
  for (const ext of extractions.filter(e => e.field_name === 'institution_pid')) {
    if (ext.current_value !== app.current_pid && ext.current_value !== app.institution_id) {
      recordFinding({
        code: `FIND-PID-${ext.id.slice(-4)}`,
        type: 'Identifier Mismatch',
        severity: 'High',
        sourceDocId: ext.document_id,
        sourceDocName: ext.file_name,
        sourceField: 'institution_pid',
        targetDocId: null,
        targetDocName: 'AICTE Institutional Profile',
        targetField: 'current_pid',
        observedValue: ext.current_value,
        expectedValue: app.current_pid || app.institution_id,
        explanation: `Extracted PID "${ext.current_value}" does not match active AICTE registered PID "${app.current_pid}".`,
        recommendedAction: 'Review institution history for PID renumbering or require document reissuance with active PID.'
      });
    }
  }

  // Check 5: Expired Certificates (Cutoff date 2026-06-30 for AY 2026-27)
  const cutoffDate = new Date('2026-06-30');
  for (const ext of extractions.filter(e => e.field_name === 'expiry_date')) {
    try {
      const expDate = new Date(ext.current_value);
      if (!isNaN(expDate.getTime()) && expDate < cutoffDate) {
        recordFinding({
          code: `FIND-EXP-${ext.id.slice(-4)}`,
          type: 'Expired Certificate',
          severity: 'Critical',
          sourceDocId: ext.document_id,
          sourceDocName: ext.file_name,
          sourceField: 'expiry_date',
          targetDocId: null,
          targetDocName: 'Academic Year 2026-27 Norms',
          targetField: 'min_validity_date',
          observedValue: ext.current_value,
          expectedValue: '2026-06-30 or later',
          explanation: `Certificate validity lapsed on ${ext.current_value}, which is prior to the commencement of AY 2026-27.`,
          recommendedAction: 'Mandate renewal certificate from the issuing department.'
        });
      }
    } catch (e) {
      // ignore date parse errors
    }
  }

  // Check 6: Intake Consistency (Proposed intake vs Sanctioned intake)
  if (appDetails && appDetails.proposed_intake_json) {
    try {
      const proposedIntakeObj = JSON.parse(appDetails.proposed_intake_json);
      for (const ext of extractions.filter(e => e.field_name === 'course_bpharm_intake' || e.field_name === 'sanctioned_intake')) {
        const sanctioned = parseInt(ext.current_value, 10);
        // Find proposed intake
        const proposedTotal = Object.values(proposedIntakeObj).reduce((a, b) => a + (Number(b) || 0), 0);
        if (sanctioned && proposedTotal > sanctioned * 1.5) {
          recordFinding({
            code: `FIND-INTAKE-${ext.id.slice(-4)}`,
            type: 'Intake Discrepancy',
            severity: 'Critical',
            sourceDocId: ext.document_id,
            sourceDocName: ext.file_name,
            sourceField: ext.field_name,
            targetDocId: null,
            targetDocName: 'Application Form Step 2 (Proposed Intake)',
            targetField: 'total_proposed_intake',
            observedValue: `${sanctioned} seats approved in statutory order`,
            expectedValue: `${proposedTotal} seats requested in portal`,
            explanation: `The application requests total intake (${proposedTotal}) exceeding the sanctioned quota (${sanctioned}) stated in the statutory affiliation certificate.`,
            recommendedAction: 'Restrict intake to the approved threshold or upload revised university intake sanction.'
          });
        }
      }
    } catch (e) {}
  }

  // Update discrepancy count in applications table
  const unreviewedOrConfirmed = db.prepare(`
    SELECT COUNT(*) as count FROM cross_document_findings
    WHERE application_id = ? AND reviewer_disposition IN ('Unreviewed', 'Confirmed Discrepancy')
  `).get(applicationId).count;

  db.prepare('UPDATE applications SET discrepancy_count = ? WHERE id = ?').run(unreviewedOrConfirmed, applicationId);

  return findings;
}

module.exports = {
  runCrossDocumentChecks
};
