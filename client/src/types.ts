export type Role = 'applicant' | 'reviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institution_id?: string;
  institution_name?: string;
  current_pid?: string;
  designation?: string;
  avatar?: string;
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  address: string;
  pin_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  established_year?: number;
  current_pid?: string;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Preliminary Validation'
  | 'Deficiencies Flagged'
  | 'Manual Review Required'
  | 'Inspection Recommended'
  | 'Returned for Correction'
  | 'Ready for Official Decision';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Application {
  id: string;
  institution_id: string;
  institution_name?: string;
  institution_type?: string;
  current_pid?: string;
  state?: string;
  district?: string;
  category: string;
  academic_year: string;
  submission_date?: string;
  overall_status: ApplicationStatus;
  risk_score: number;
  risk_level: RiskLevel;
  assigned_reviewer_id?: string;
  assigned_reviewer_name?: string;
  missing_doc_count: number;
  discrepancy_count: number;
  compliance_status: string;
  last_updated: string;
}

export interface ApplicationDetails {
  application_id: string;
  programmes_json?: string;
  proposed_intake_json?: string;
  programmes?: string[];
  proposed_intake?: Record<string, number>;
  previous_approval_ref?: string;
  land_area_acres?: number;
  built_up_area_sqm?: number;
  principal_name?: string;
  principal_email?: string;
  principal_phone?: string;
  additional_notes?: string;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  field_name: string;
  original_value: string;
  current_value: string;
  confidence_score: number;
  is_overridden: number;
  overridden_by?: string;
  override_reason?: string;
  bounding_box_json?: string;
  created_at: string;
}

export interface VerificationRecord {
  id: string;
  document_id: string;
  verification_method: string;
  source_authority: string;
  reference_id: string;
  result: 'Verified' | 'Mismatch Detected' | 'Pending Verification' | 'Unable to Verify' | 'Manual Review Required' | 'Invalid Digital Signature';
  is_simulated: number;
  details?: any;
  verified_at: string;
  verified_by?: string;
}

export interface DocumentItem {
  id: string;
  application_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash_sha256: string;
  mime_type: string;
  upload_date: string;
  status: 'Uploaded' | 'Processing' | 'Processed' | 'Discrepancy Detected' | 'Verified' | 'Pending External Verification' | 'Manual Review Required' | 'Rejected';
  extracted_text?: string;
  page_count: number;
  qr_decoded_text?: string;
  qr_source_url?: string;
  extractions?: DocumentExtraction[];
  verification_records?: VerificationRecord[];
}

export interface CrossDocumentFinding {
  id: string;
  application_id: string;
  finding_code: string;
  finding_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  source_doc_id?: string;
  source_doc_name?: string;
  source_field?: string;
  target_doc_id?: string;
  target_doc_name?: string;
  target_field?: string;
  observed_value?: string;
  expected_value?: string;
  explanation: string;
  recommended_action?: string;
  reviewer_disposition: 'Unreviewed' | 'Confirmed Discrepancy' | 'Dismissed False Positive' | 'Requested Evidence' | 'Resolved';
  disposition_reason?: string;
  disposition_by?: string;
  disposition_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRule {
  id: string;
  rule_code: string;
  name: string;
  description: string;
  applicable_categories_json?: string;
  applicable_categories?: string[];
  requirement_type: string;
  rule_logic_json?: string;
  rule_logic?: any;
  severity: 'Critical' | 'Major' | 'Minor';
  aicte_handbook_ref?: string;
  version: number;
  is_enabled: number;
  effective_date?: string;
  updated_at?: string;
}

export interface ComplianceEvaluation {
  id: string;
  application_id: string;
  rule_id: string;
  rule_version: number;
  rule_code?: string;
  rule_name?: string;
  rule_severity?: string;
  aicte_handbook_ref?: string;
  status: 'Passed' | 'Failed' | 'Warning' | 'Not Applicable' | 'Awaiting Evidence' | 'Requires Human Review';
  evidence_found?: string;
  explanation?: string;
  corrective_action?: string;
  evaluated_at: string;
}

export interface InfrastructureEvidence {
  id: string;
  application_id: string;
  category: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  latitude?: number;
  longitude?: number;
  geo_location_name?: string;
  capture_date?: string;
  detected_elements_json?: string;
  detected_elements?: string[];
  review_status: 'Verified' | 'Potential Discrepancy' | 'Needs Physical Inspection';
  reviewer_notes?: string;
  is_duplicate: number;
  created_at: string;
  institution_name?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  application_id?: string;
  action: string;
  target_type?: string;
  target_ref?: string;
  outcome: string;
  details_json?: string;
  details?: any;
  ip_address: string;
}

export interface NotificationItem {
  id: string;
  user_role: string;
  title: string;
  message: string;
  application_id?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: number;
  created_at: string;
}

export interface RiskFactor {
  category: string;
  severity: string;
  points: number;
  description: string;
}

export interface RiskBreakdown {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  disclaimer: string;
}
