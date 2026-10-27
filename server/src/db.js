const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'verifyai.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
try {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {
  console.warn('[DB] Pragma setting notice:', e.message);
}

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('applicant', 'reviewer', 'admin')),
      institution_id TEXT,
      designation TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Institutions table
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      pin_code TEXT,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      established_year INTEGER,
      current_pid TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Applications table
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      category TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      submission_date DATETIME,
      overall_status TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'Low',
      assigned_reviewer_id TEXT,
      assigned_reviewer_name TEXT,
      missing_doc_count INTEGER DEFAULT 0,
      discrepancy_count INTEGER DEFAULT 0,
      compliance_status TEXT DEFAULT 'Pending Evaluation',
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
    );

    -- Application Details table
    CREATE TABLE IF NOT EXISTS application_details (
      application_id TEXT PRIMARY KEY,
      programmes_json TEXT,
      proposed_intake_json TEXT,
      previous_approval_ref TEXT,
      land_area_acres REAL,
      built_up_area_sqm REAL,
      principal_name TEXT,
      principal_email TEXT,
      principal_phone TEXT,
      additional_notes TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- Documents table
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_hash_sha256 TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL,
      extracted_text TEXT,
      page_count INTEGER DEFAULT 1,
      qr_decoded_text TEXT,
      qr_source_url TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- Document Extractions table (field-level with confidence & overrides)
    CREATE TABLE IF NOT EXISTS document_extractions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      original_value TEXT,
      current_value TEXT,
      confidence_score REAL DEFAULT 0.85,
      is_overridden INTEGER DEFAULT 0,
      overridden_by TEXT,
      override_reason TEXT,
      bounding_box_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    -- Cross-Document Findings table
    CREATE TABLE IF NOT EXISTS cross_document_findings (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      finding_code TEXT NOT NULL,
      finding_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')),
      source_doc_id TEXT,
      source_doc_name TEXT,
      source_field TEXT,
      target_doc_id TEXT,
      target_doc_name TEXT,
      target_field TEXT,
      observed_value TEXT,
      expected_value TEXT,
      explanation TEXT NOT NULL,
      recommended_action TEXT,
      reviewer_disposition TEXT DEFAULT 'Unreviewed',
      disposition_reason TEXT,
      disposition_by TEXT,
      disposition_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- Compliance Rules table
    CREATE TABLE IF NOT EXISTS compliance_rules (
      id TEXT PRIMARY KEY,
      rule_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      applicable_categories_json TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      rule_logic_json TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('Critical', 'Major', 'Minor')),
      aicte_handbook_ref TEXT,
      version INTEGER DEFAULT 1,
      is_enabled INTEGER DEFAULT 1,
      effective_date TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Compliance Evaluations table
    CREATE TABLE IF NOT EXISTS compliance_evaluations (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      rule_version INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Passed', 'Failed', 'Warning', 'Not Applicable', 'Awaiting Evidence', 'Requires Human Review')),
      evidence_found TEXT,
      explanation TEXT,
      corrective_action TEXT,
      evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (rule_id) REFERENCES compliance_rules(id) ON DELETE CASCADE
    );

    -- Infrastructure Evidence table
    CREATE TABLE IF NOT EXISTS infrastructure_evidence (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      geo_location_name TEXT,
      capture_date TEXT,
      detected_elements_json TEXT,
      review_status TEXT DEFAULT 'Verified',
      reviewer_notes TEXT,
      is_duplicate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    -- Verification Records table
    CREATE TABLE IF NOT EXISTS verification_records (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      verification_method TEXT NOT NULL,
      source_authority TEXT NOT NULL,
      reference_id TEXT,
      result TEXT NOT NULL,
      is_simulated INTEGER DEFAULT 1,
      details_json TEXT,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_by TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    -- Mock Issuer Registry table
    CREATE TABLE IF NOT EXISTS mock_issuer_registry (
      id TEXT PRIMARY KEY,
      issuer_type TEXT NOT NULL,
      document_reference TEXT NOT NULL UNIQUE,
      expected_institution_name TEXT NOT NULL,
      expected_institution_id TEXT NOT NULL,
      expected_issue_date TEXT,
      expected_expiry_date TEXT,
      expected_signatory TEXT,
      verification_status TEXT DEFAULT 'Valid',
      remarks TEXT
    );

    -- Audit Events table
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      application_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_ref TEXT,
      outcome TEXT NOT NULL,
      details_json TEXT,
      ip_address TEXT DEFAULT '127.0.0.1'
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_role TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      application_id TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_apps_institution ON applications(institution_id);
    CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(overall_status);
    CREATE INDEX IF NOT EXISTS idx_docs_app ON documents(application_id);
    CREATE INDEX IF NOT EXISTS idx_findings_app ON cross_document_findings(application_id);
    CREATE INDEX IF NOT EXISTS idx_evals_app ON compliance_evaluations(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_app ON audit_events(application_id);
    CREATE INDEX IF NOT EXISTS idx_notifs_role ON notifications(user_role);
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
