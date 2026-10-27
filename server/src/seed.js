const { db } = require('./db');

function seedDatabase() {
  console.log('[Seed] Seeding database with realistic synthetic AICTE data...');

  try {
    db.exec('BEGIN TRANSACTION;');
    // Clear existing data
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM audit_events').run();
    db.prepare('DELETE FROM mock_issuer_registry').run();
    db.prepare('DELETE FROM verification_records').run();
    db.prepare('DELETE FROM infrastructure_evidence').run();
    db.prepare('DELETE FROM compliance_evaluations').run();
    db.prepare('DELETE FROM compliance_rules').run();
    db.prepare('DELETE FROM cross_document_findings').run();
    db.prepare('DELETE FROM document_extractions').run();
    db.prepare('DELETE FROM documents').run();
    db.prepare('DELETE FROM application_details').run();
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM institutions').run();
    db.prepare('DELETE FROM users').run();

    // 1. Users
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, role, institution_id, designation, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('usr-applicant-1', 'Dr. Rajesh Sharma', 'applicant@demo.aicte.gov.in', 'applicant', 'INST-MH-2024-001', 'Registrar & Head of Compliance', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
    insertUser.run('usr-reviewer-1', 'Smt. Anita Deshmukh', 'reviewer@aicte.gov.in', 'reviewer', null, 'Senior AICTE Evaluation Officer', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
    insertUser.run('usr-admin-1', 'Dr. Vikramaditya Sen', 'admin@aicte.gov.in', 'admin', null, 'Chief Regulatory Administrator (AICTE HQ)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

    // 2. Institutions
    const insertInst = db.prepare(`
      INSERT INTO institutions (id, name, type, state, district, address, pin_code, contact_person, email, phone, established_year, current_pid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const institutions = [
      ['INST-MH-2024-001', 'Apex Institute of Technology & Research', 'Engineering & Technology', 'Maharashtra', 'Pune', 'Survey No. 42/1, Hinjawadi Phase 2, Pune', '411057', 'Dr. Rajesh Sharma', 'contact@apextech.ac.in', '+91 20 2899 4400', 2008, '1-348911029'],
      ['INST-KA-2024-002', 'Kaveri College of Engineering & Research', 'Engineering & Technology', 'Karnataka', 'Bengaluru Urban', 'Plot 18, Electronic City Phase 1, Hosur Road, Bengaluru', '560100', 'Prof. V. Srinivas', 'principal@kaveriengg.edu.in', '+91 80 4123 7700', 2012, '1-450982311'],
      ['INST-DL-2024-003', 'Vidya Sagar Institute of Management Studies', 'Management', 'Delhi', 'South Delhi', 'Sector 7, Institutional Area, Pushp Vihar, New Delhi', '110017', 'Dr. Meenakshi Soni', 'info@vidyasagar-mgmt.ac.in', '+91 11 2956 8800', 2015, '1-512093847'],
      ['INST-BR-2024-004', 'Nalanda Polytechnic College', 'Polytechnic', 'Bihar', 'Patna', 'Khagaul Road, Danapur Cantt, Patna', '801503', 'Er. Alok Kumar', 'contact@nalandapolytechnic.org', '+91 612 2489 123', 2016, '1-628471092'],
      ['INST-GJ-2024-005', 'Saraswati Institute of Pharmaceutical Sciences', 'Pharmacy', 'Gujarat', 'Gandhinagar', 'Knowledge Corridor, Near Infocity, Gandhinagar', '382007', 'Dr. Jignesh Patel', 'director@saraswatipharma.edu.in', '+91 79 2328 5500', 2011, '1-739102845'],
      ['INST-AP-2024-006', 'Godavari Academy of Technology & Sciences', 'Engineering & Technology', 'Andhra Pradesh', 'Visakhapatnam', 'Madhurawada Campus, IT SEZ Hill 2, Visakhapatnam', '530048', 'Prof. R. C. Rao', 'admissions@godavariacademy.org', '+91 891 2789 900', 2005, '1-849201934'],
      ['INST-UK-2024-007', 'Himalaya Institute of Computer Applications', 'MCA / Applied Tech', 'Uttarakhand', 'Dehradun', 'Mussoorie Diversion Road, Malsi, Dehradun', '248003', 'Dr. Sunil Rawat', 'registrar@himalayacomputers.ac.in', '+91 135 2734 600', 2018, '1-950293817'],
      ['INST-TS-2024-008', 'Deccan College of Architecture & Design', 'Architecture & Planning', 'Telangana', 'Hyderabad', 'Gachibowli Financial District, Hyderabad', '500032', 'Ar. Farhana Begum', 'dean@deccanarch.edu.in', '+91 40 6789 2200', 2019, '1-102938475']
    ];

    for (const inst of institutions) {
      insertInst.run(...inst);
    }

    // 3. Compliance Rules (Based on AICTE Approval Process Handbook 2026-27)
    const insertRule = db.prepare(`
      INSERT INTO compliance_rules (id, rule_code, name, description, applicable_categories_json, requirement_type, rule_logic_json, severity, aicte_handbook_ref, version, is_enabled, effective_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const rules = [
      [
        'rule-001',
        'AICTE-RULE-MAND-01',
        'Mandatory Document Completeness Checklist',
        'All mandatory institutional documents required for the specific application category must be uploaded and valid.',
        JSON.stringify(['Extension of Approval (EOA)', 'New Institution Approval', 'Increase in Intake / Additional Course', 'Change in Site / Campus']),
        'Document Mandatory',
        JSON.stringify({ check: 'required_documents_present', threshold: 100 }),
        'Critical',
        'Chapter I, Section 1.4 & Appendix 16',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-002',
        'AICTE-RULE-FIRE-02',
        'Valid Fire Safety NOC Validity Check',
        'Fire Safety Certificate / NOC issued by competent State Disaster Management / Fire Service authority must be current and not expired for the requested academic year.',
        JSON.stringify(['Extension of Approval (EOA)', 'New Institution Approval', 'Increase in Intake / Additional Course', 'Change in Site / Campus']),
        'Date Validity',
        JSON.stringify({ check: 'expiry_after', target_field: 'fire_noc_expiry', min_date: '2026-06-30' }),
        'Critical',
        'Chapter I, Section 1.5.2 & Appendix 2',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-003',
        'AICTE-RULE-PID-03',
        'Permanent Institute ID (PID) Consistency Across Records',
        'Permanent Institute ID (PID) appearing in land records, building approvals, and affiliation letters must identically match the current registered AICTE institutional PID.',
        JSON.stringify(['Extension of Approval (EOA)', 'Increase in Intake / Additional Course', 'Change in Site / Campus']),
        'Identifier Consistency',
        JSON.stringify({ check: 'exact_field_match', field_a: 'application_pid', field_b: 'document_pid' }),
        'Major',
        'Chapter II, Section 2.2.1',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-004',
        'AICTE-RULE-AFFL-04',
        'Affiliating University Course & Intake Cap Compliance',
        'The proposed intake for any degree/diploma course must not exceed the sanctioned intake specified in the Affiliating University NOC / Affiliation Order.',
        JSON.stringify(['Extension of Approval (EOA)', 'Increase in Intake / Additional Course']),
        'Intake Consistency',
        JSON.stringify({ check: 'proposed_le_sanctioned', form_field: 'proposed_intake', doc_field: 'university_sanctioned_intake' }),
        'Critical',
        'Chapter II, Section 2.7 & Appendix 3',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-005',
        'AICTE-RULE-LAND-05',
        'Minimum Contiguous Land Area Norms',
        'Institutional land must satisfy the minimum required contiguous land norms for the region (Mega/Metro: min 1.5 acres, Urban: min 2.5 acres, Rural: min 7.5 acres) with registered title/lease >= 30 years.',
        JSON.stringify(['New Institution Approval', 'Change in Site / Campus']),
        'Infrastructure Area',
        JSON.stringify({ check: 'land_area_norm', min_acres: 2.5 }),
        'Critical',
        'Chapter IV, Section 4.1 & Appendix 4',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-006',
        'AICTE-RULE-HASH-06',
        'Duplicate Document and Re-use Prevention',
        'Uploaded certificates and title documents must have unique SHA-256 cryptographic hashes and must not be identical copies across different required document categories.',
        JSON.stringify(['Extension of Approval (EOA)', 'New Institution Approval', 'Increase in Intake / Additional Course', 'Change in Site / Campus']),
        'Document Integrity',
        JSON.stringify({ check: 'unique_file_hash' }),
        'Major',
        'Chapter I, Section 1.8 (Electronic Verification)',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-007',
        'AICTE-RULE-DSC-07',
        'Authorized Digital Signature Verification (Class 3 DSC)',
        'Submitted application declarations and audited statements must be electronically signed with a verified Class 3 Digital Signature Certificate of the registered Head of Institution.',
        JSON.stringify(['Extension of Approval (EOA)', 'New Institution Approval', 'Increase in Intake / Additional Course', 'Change in Site / Campus']),
        'Authentication',
        JSON.stringify({ check: 'valid_digital_signature', required_level: 'Class 3' }),
        'Major',
        'Chapter I, Section 1.3.1',
        1,
        1,
        '2026-01-01'
      ],
      [
        'rule-008',
        'AICTE-RULE-LAB-08',
        'Infrastructure Evidence and Geotagging Requirement',
        'Laboratory, library, and workshop photographs must include embedded GPS metadata and match the campus cadastral coordinate boundary.',
        JSON.stringify(['New Institution Approval', 'Increase in Intake / Additional Course', 'Change in Site / Campus']),
        'Infrastructure Evidence',
        JSON.stringify({ check: 'geotag_within_radius', radius_meters: 500 }),
        'Minor',
        'Appendix 5 (Norms for Essential & Desirable Requirements)',
        1,
        1,
        '2026-01-01'
      ]
    ];

    for (const rule of rules) {
      insertRule.run(...rule);
    }

    // 4. Mock Issuer Registry (Simulating State Govt, Fire Services, Affiliating Universities, AICTE database)
    const insertMockIssuer = db.prepare(`
      INSERT INTO mock_issuer_registry (id, issuer_type, document_reference, expected_institution_name, expected_institution_id, expected_issue_date, expected_expiry_date, expected_signatory, verification_status, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const mockRecords = [
      ['mis-01', 'State Fire Service', 'NOC/FS/MH/2025/901', 'Apex Institute of Technology & Research', 'INST-MH-2024-001', '2025-05-10', '2027-05-09', 'Chief Fire Officer, Pune Dist', 'Valid', 'Official verification confirmed via State Disaster & Fire Portal'],
      ['mis-02', 'Affiliating University', 'SPPU/AFF/ENGG/2026-27/412', 'Apex Institute of Technology & Research', 'INST-MH-2024-001', '2026-01-15', '2027-06-30', 'Registrar, Savitribai Phule Pune University', 'Valid', 'Permanent affiliation confirmed for B.Tech CS, Mechanical, ECE'],
      ['mis-03', 'State Fire Service', 'FS-NOC-DL-2021-884', 'Vidya Sagar Institute of Management Studies', 'INST-DL-2024-003', '2021-12-31', '2024-12-31', 'Divisional Fire Officer, Delhi Fire Service', 'Expired', 'Certificate expired on 31-Dec-2024. Renewal application pending inspection.'],
      ['mis-04', 'Building Safety Authority', 'PWD/BLDG/PAT/2023/110', 'Nalanda Polytechnic College', '1-9876543', '2023-04-12', '2028-04-11', 'Executive Engineer, Bihar PWD', 'Valid', 'Issued under legacy PID 1-9876543 prior to state re-registration.'],
      ['mis-05', 'Affiliating University', 'GTU/AFF/PHARM/2026/89', 'Saraswati Institute of Pharmaceutical Sciences', 'INST-GJ-2024-005', '2026-01-10', '2027-06-30', 'Registrar, Gujarat Technological University', 'Sanctioned Mismatch', 'University NOC sanctions only 60 seats for B.Pharm; applicant applied for 120 intake.'],
      ['mis-06', 'Class 3 CA Trust', 'DSC-ID-APEX-001', 'Apex Institute of Technology & Research', 'INST-MH-2024-001', '2024-03-01', '2027-03-01', 'eMudhra Class 3 Institutional CA', 'Valid', 'Authentic cryptographic certificate path validated.'],
      ['mis-07', 'Class 3 CA Trust', 'DSC-ID-HIMALAYA-99', 'Himalaya Institute of Computer Applications', 'INST-UK-2024-007', '2023-01-10', '2024-01-10', 'Self-Signed / Untrusted Root', 'Invalid Digital Signature', 'Signature certificate untrusted; root CA not in CCA India National Trust Store.']
    ];

    for (const rec of mockRecords) {
      insertMockIssuer.run(...rec);
    }

    // 5. Applications (12 Seeded Applications covering every requested edge case)
    const insertApp = db.prepare(`
      INSERT INTO applications (id, institution_id, category, academic_year, submission_date, overall_status, risk_score, risk_level, assigned_reviewer_id, assigned_reviewer_name, missing_doc_count, discrepancy_count, compliance_status, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAppDetails = db.prepare(`
      INSERT INTO application_details (application_id, programmes_json, proposed_intake_json, previous_approval_ref, land_area_acres, built_up_area_sqm, principal_name, principal_email, principal_phone, additional_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleApps = [
      // Case 1: Complete application with no detected issues
      {
        id: 'APP-2026-1001',
        instId: 'INST-MH-2024-001',
        category: 'Extension of Approval (EOA)',
        academic_year: '2026-27',
        submission_date: '2026-02-10 10:30:00',
        status: 'Ready for Official Decision',
        risk_score: 5,
        risk_level: 'Low',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 0,
        comp_status: 'Fully Compliant (8/8 Passed)',
        updated: '2026-02-15 14:20:00',
        programmes: ['Computer Engineering (180)', 'Electronics & Telecomm (120)', 'Mechanical Engineering (60)', 'Artificial Intelligence & Data Science (60)'],
        proposed_intake: { 'Computer Engineering': 180, 'Electronics & Telecomm': 120, 'Mechanical Engineering': 60, 'AI & DS': 60 },
        prev_approval: 'F.No. Western/1-348911029/2025/EOA',
        land: 10.5,
        built_up: 22400.0,
        principal: 'Dr. Suresh V. Kulkarni',
        email: 'principal@apextech.ac.in',
        phone: '+91 98220 11223',
        notes: 'Routine EOA application with complete audit trail and verified University affiliation order.'
      },
      // Case 2: Missing mandatory document
      {
        id: 'APP-2026-1002',
        instId: 'INST-KA-2024-002',
        category: 'New Institution Approval',
        academic_year: '2026-27',
        submission_date: '2026-02-12 11:15:00',
        status: 'Deficiencies Flagged',
        risk_score: 65,
        risk_level: 'High',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 1,
        discrepancies: 1,
        comp_status: 'Non-Compliant (Missing Mandatory NOC)',
        updated: '2026-02-16 09:45:00',
        programmes: ['Computer Science & Engg (60)', 'Information Science (60)', 'Robotics & Automation (60)'],
        proposed_intake: { 'CSE': 60, 'ISE': 60, 'Robotics': 60 },
        prev_approval: 'None (New Institution)',
        land: 5.2,
        built_up: 12500.0,
        principal: 'Prof. V. Srinivas',
        email: 'principal@kaveriengg.edu.in',
        phone: '+91 94480 33445',
        notes: 'Mandatory Affiliating University NOC document missing from application bundle.'
      },
      // Case 3: Document with an expired certificate
      {
        id: 'APP-2026-1003',
        instId: 'INST-DL-2024-003',
        category: 'Extension of Approval (EOA)',
        academic_year: '2026-27',
        submission_date: '2026-02-14 14:00:00',
        status: 'Deficiencies Flagged',
        risk_score: 55,
        risk_level: 'Medium',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 1,
        comp_status: 'Deficient (Expired Fire NOC)',
        updated: '2026-02-17 11:30:00',
        programmes: ['Master of Business Administration (MBA - 180)', 'PGDM in Business Analytics (60)'],
        proposed_intake: { 'MBA': 180, 'PGDM Analytics': 60 },
        prev_approval: 'F.No. North-West/1-512093847/2025/EOA',
        land: 2.5,
        built_up: 8900.0,
        principal: 'Dr. Meenakshi Soni',
        email: 'director@vidyasagar-mgmt.ac.in',
        phone: '+91 98110 55667',
        notes: 'Delhi Fire Service NOC expired on 31-Dec-2024. Renewal slip uploaded instead of fresh certificate.'
      },
      // Case 4: Institution ID / PID mismatch
      {
        id: 'APP-2026-1004',
        instId: 'INST-BR-2024-004',
        category: 'Change in Site / Campus',
        academic_year: '2026-27',
        submission_date: '2026-02-15 16:20:00',
        status: 'Manual Review Required',
        risk_score: 70,
        risk_level: 'High',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 2,
        comp_status: 'Flagged (Identifier Mismatch)',
        updated: '2026-02-18 10:15:00',
        programmes: ['Diploma in Civil Engineering (60)', 'Diploma in Mechanical (60)', 'Diploma in Electrical (60)'],
        proposed_intake: { 'Civil': 60, 'Mechanical': 60, 'Electrical': 60 },
        prev_approval: 'F.No. Northern/1-628471092/2025/EOA',
        land: 4.8,
        built_up: 6400.0,
        principal: 'Er. Alok Kumar',
        email: 'contact@nalandapolytechnic.org',
        phone: '+91 94310 77889',
        notes: 'Building Safety Certificate quotes obsolete PID 1-9876543 instead of current registered PID 1-628471092.'
      },
      // Case 5: Conflicting course or intake information
      {
        id: 'APP-2026-1005',
        instId: 'INST-GJ-2024-005',
        category: 'Increase in Intake / Additional Course',
        academic_year: '2026-27',
        submission_date: '2026-02-16 12:00:00',
        status: 'Deficiencies Flagged',
        risk_score: 80,
        risk_level: 'Critical',
        reviewer_id: null,
        reviewer_name: 'Unassigned',
        missing_docs: 0,
        discrepancies: 2,
        comp_status: 'Violated Intake Ceiling',
        updated: '2026-02-19 15:40:00',
        programmes: ['Bachelor of Pharmacy (B.Pharm - 120)', 'Master of Pharmacy (Pharmaceutics - 15)'],
        proposed_intake: { 'B.Pharm': 120, 'M.Pharm': 15 },
        prev_approval: 'F.No. Central/1-739102845/2025/EOA',
        land: 3.2,
        built_up: 7800.0,
        principal: 'Dr. Jignesh Patel',
        email: 'director@saraswatipharma.edu.in',
        phone: '+91 98250 88990',
        notes: 'University affiliation NOC approves only 60 seats for B.Pharm, while application requests 120.'
      },
      // Case 6: Duplicated uploaded document
      {
        id: 'APP-2026-1006',
        instId: 'INST-AP-2024-006',
        category: 'Extension of Approval (EOA)',
        academic_year: '2026-27',
        submission_date: '2026-02-17 15:10:00',
        status: 'Manual Review Required',
        risk_score: 75,
        risk_level: 'High',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 1,
        comp_status: 'Flagged (Duplicate File Hashes)',
        updated: '2026-02-20 11:00:00',
        programmes: ['Computer Science & System Engg (120)', 'Data Science (60)', 'Electrical & Electronics (60)'],
        proposed_intake: { 'CSSE': 120, 'DS': 60, 'EEE': 60 },
        prev_approval: 'F.No. South-Central/1-849201934/2025/EOA',
        land: 15.0,
        built_up: 28000.0,
        principal: 'Prof. R. C. Rao',
        email: 'admissions@godavariacademy.org',
        phone: '+91 98480 22334',
        notes: 'Land Ownership Deed uploaded is a byte-for-byte duplicate of Building Safety certificate (SHA256 clash).'
      },
      // Case 7: Suspicious document requiring manual verification
      {
        id: 'APP-2026-1007',
        instId: 'INST-UK-2024-007',
        category: 'Extension of Approval (EOA)',
        academic_year: '2026-27',
        submission_date: '2026-02-18 09:30:00',
        status: 'Manual Review Required',
        risk_score: 85,
        risk_level: 'Critical',
        reviewer_id: null,
        reviewer_name: 'Unassigned',
        missing_docs: 0,
        discrepancies: 3,
        comp_status: 'Flagged (Untrusted DSC & Altered Excerpt)',
        updated: '2026-02-21 16:15:00',
        programmes: ['Master of Computer Applications (MCA - 120)', 'M.Sc. Information Technology (60)'],
        proposed_intake: { 'MCA': 120, 'MSc IT': 60 },
        prev_approval: 'F.No. Northern/1-950293817/2025/EOA',
        land: 2.1,
        built_up: 5200.0,
        principal: 'Dr. Sunil Rawat',
        email: 'registrar@himalayacomputers.ac.in',
        phone: '+91 97600 44556',
        notes: 'DSC signature check failed (self-signed root), building safety date altered with mismatched font weight.'
      },
      // Case 8: Application awaiting an external source response
      {
        id: 'APP-2026-1008',
        instId: 'INST-TS-2024-008',
        category: 'New Institution Approval',
        academic_year: '2026-27',
        submission_date: '2026-02-19 14:45:00',
        status: 'Under Preliminary Validation',
        risk_score: 35,
        risk_level: 'Medium',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 1,
        comp_status: 'Awaiting External Registry',
        updated: '2026-02-22 13:00:00',
        programmes: ['Bachelor of Architecture (B.Arch - 80)', 'Master of Urban Planning (20)'],
        proposed_intake: { 'B.Arch': 80, 'M.Plan': 20 },
        prev_approval: 'None (New Institution)',
        land: 3.5,
        built_up: 9400.0,
        principal: 'Ar. Farhana Begum',
        email: 'dean@deccanarch.edu.in',
        phone: '+91 98490 66778',
        notes: 'State Land Revenue Dharani API gateway returned 503 HTTP Service Unavailable. Automatic retry queued.'
      },
      // Case 9: Application returned for correction
      {
        id: 'APP-2026-1009',
        instId: 'INST-MH-2024-001',
        category: 'Increase in Intake / Additional Course',
        academic_year: '2026-27',
        submission_date: '2026-02-20 10:00:00',
        status: 'Returned for Correction',
        risk_score: 45,
        risk_level: 'Medium',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 1,
        discrepancies: 1,
        comp_status: 'Action Required by Institution',
        updated: '2026-02-23 15:30:00',
        programmes: ['B.Tech Cyber Security (60)', 'M.Tech AI (30)'],
        proposed_intake: { 'Cyber Security': 60, 'M.Tech AI': 30 },
        prev_approval: 'F.No. Western/1-348911029/2025/EOA',
        land: 10.5,
        built_up: 22400.0,
        principal: 'Dr. Suresh V. Kulkarni',
        email: 'principal@apextech.ac.in',
        phone: '+91 98220 11223',
        notes: 'Returned by AICTE Reviewer Smt. Deshmukh: Please upload revised audited balance sheet and updated faculty cadre ratio.'
      },
      // Case 10: Infrastructure evidence requiring further inspection
      {
        id: 'APP-2026-1010',
        instId: 'INST-KA-2024-002',
        category: 'New Institution Approval',
        academic_year: '2026-27',
        submission_date: '2026-02-21 13:25:00',
        status: 'Inspection Recommended',
        risk_score: 65,
        risk_level: 'High',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 2,
        comp_status: 'Physical Scrutiny Recommended',
        updated: '2026-02-24 10:45:00',
        programmes: ['Civil Engineering (60)', 'Mechanical Engineering (60)'],
        proposed_intake: { 'Civil': 60, 'Mechanical': 60 },
        prev_approval: 'None',
        land: 5.2,
        built_up: 12500.0,
        principal: 'Prof. V. Srinivas',
        email: 'principal@kaveriengg.edu.in',
        phone: '+91 94480 33445',
        notes: 'Computer lab photo geocoded to 12.8399 N, 77.6770 E which deviates >150km from claimed campus location. Physical Expert Visit Committee recommended.'
      },
      // Case 11: Application with resolved deficiencies
      {
        id: 'APP-2026-1011',
        instId: 'INST-DL-2024-003',
        category: 'Extension of Approval (EOA)',
        academic_year: '2026-27',
        submission_date: '2026-02-22 17:00:00',
        status: 'Ready for Official Decision',
        risk_score: 10,
        risk_level: 'Low',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 0,
        comp_status: 'Deficiencies Resolved (7/8 Passed, 1 NA)',
        updated: '2026-02-25 12:10:00',
        programmes: ['MBA (120)'],
        proposed_intake: { 'MBA': 120 },
        prev_approval: 'F.No. North-West/1-512093847/2025/EOA',
        land: 2.5,
        built_up: 8900.0,
        principal: 'Dr. Meenakshi Soni',
        email: 'director@vidyasagar-mgmt.ac.in',
        phone: '+91 98110 55667',
        notes: 'Institution previously uploaded expired Fire NOC, resubmitted valid DFS certificate DFS/2026/0498. Verified and cleared.'
      },
      // Case 12: Application ready for official review
      {
        id: 'APP-2026-1012',
        instId: 'INST-AP-2024-006',
        category: 'Extension of Approval (EOA)',
        academic_year: '2026-27',
        submission_date: '2026-02-23 11:30:00',
        status: 'Ready for Official Decision',
        risk_score: 0,
        risk_level: 'Low',
        reviewer_id: 'usr-reviewer-1',
        reviewer_name: 'Smt. Anita Deshmukh',
        missing_docs: 0,
        discrepancies: 0,
        comp_status: 'Exemplary Compliance (8/8 Passed)',
        updated: '2026-02-25 16:00:00',
        programmes: ['B.Tech ECE (120)', 'B.Tech IT (60)', 'M.Tech VLSI (18)'],
        proposed_intake: { 'ECE': 120, 'IT': 60, 'VLSI': 18 },
        prev_approval: 'F.No. South-Central/1-849201934/2025/EOA',
        land: 15.0,
        built_up: 28000.0,
        principal: 'Prof. R. C. Rao',
        email: 'admissions@godavariacademy.org',
        phone: '+91 98480 22334',
        notes: '100% verified documents, Class 3 digital signature confirmed, zero discrepancy, ready for Regional Committee final sanction.'
      }
    ];

    for (const app of sampleApps) {
      insertApp.run(
        app.id,
        app.instId,
        app.category,
        app.academic_year,
        app.submission_date,
        app.status,
        app.risk_score,
        app.risk_level,
        app.reviewer_id,
        app.reviewer_name,
        app.missing_docs,
        app.discrepancies,
        app.comp_status,
        app.updated
      );

      insertAppDetails.run(
        app.id,
        JSON.stringify(app.programmes),
        JSON.stringify(app.proposed_intake),
        app.prev_approval,
        app.land,
        app.built_up,
        app.principal,
        app.email,
        app.phone,
        app.notes
      );
    }

    // 6. Documents and Field Extractions for realistic applications
    const insertDoc = db.prepare(`
      INSERT INTO documents (id, application_id, document_type, file_name, file_path, file_size, file_hash_sha256, mime_type, upload_date, status, extracted_text, page_count, qr_decoded_text, qr_source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertExtraction = db.prepare(`
      INSERT INTO document_extractions (id, document_id, field_name, original_value, current_value, confidence_score, is_overridden, overridden_by, override_reason, bounding_box_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFinding = db.prepare(`
      INSERT INTO cross_document_findings (id, application_id, finding_code, finding_type, severity, source_doc_id, source_doc_name, source_field, target_doc_id, target_doc_name, target_field, observed_value, expected_value, explanation, recommended_action, reviewer_disposition, disposition_reason, disposition_by, disposition_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVerif = db.prepare(`
      INSERT INTO verification_records (id, document_id, verification_method, source_authority, reference_id, result, is_simulated, details_json, verified_at, verified_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Let's populate documents for APP-2026-1001 (Clean Application)
    insertDoc.run(
      'doc-1001-1',
      'APP-2026-1001',
      'AICTE Previous Approval Order',
      'AICTE_EOA_Order_2025_26.pdf',
      '/uploads/sample_eoa_apex.pdf',
      842100,
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'application/pdf',
      '2026-02-10 10:12:00',
      'Verified',
      'ALL INDIA COUNCIL FOR TECHNICAL EDUCATION\nAPPROVAL ORDER 2025-26\nPID: 1-348911029\nInstitution: Apex Institute of Technology & Research, Hinjawadi Pune\nApproved Courses: Computer Engg (180), E&TC (120), Mech (60), AI&DS (60)',
      3,
      'https://facilities.aicte-india.org/eoa/verify?ref=1-348911029-2025',
      'https://facilities.aicte-india.org/eoa/verify?ref=1-348911029-2025'
    );

    insertExtraction.run('ext-1001-1-1', 'doc-1001-1', 'institution_name', 'Apex Institute of Technology & Research', 'Apex Institute of Technology & Research', 0.98, 0, null, null, JSON.stringify({ page: 1, x: 120, y: 150, w: 380, h: 24 }));
    insertExtraction.run('ext-1001-1-2', 'doc-1001-1', 'institution_pid', '1-348911029', '1-348911029', 0.99, 0, null, null, JSON.stringify({ page: 1, x: 120, y: 180, w: 140, h: 20 }));
    insertExtraction.run('ext-1001-1-3', 'doc-1001-1', 'approval_year', '2025-26', '2025-26', 0.96, 0, null, null, JSON.stringify({ page: 1, x: 420, y: 150, w: 90, h: 20 }));
    insertExtraction.run('ext-1001-1-4', 'doc-1001-1', 'total_approved_intake', '420', '420', 0.94, 0, null, null, JSON.stringify({ page: 2, x: 380, y: 310, w: 60, h: 22 }));

    insertVerif.run(
      'vr-1001-1',
      'doc-1001-1',
      'Digital Signature Validation',
      'CCA India / eMudhra Class 3',
      'DSC-ID-APEX-001',
      'Verified',
      1,
      JSON.stringify({ signer: 'Dr. Suresh V. Kulkarni', certificate_status: 'Valid', issuer: 'eMudhra CA 2024', trust_chain: 'Root -> Sub-CA -> User' }),
      '2026-02-10 10:35:00',
      'AICTE Automated Gateway'
    );

    insertDoc.run(
      'doc-1001-2',
      'APP-2026-1001',
      'Fire Safety NOC',
      'Fire_Safety_NOC_Pune_2025.pdf',
      '/uploads/fire_safety_apex.pdf',
      512400,
      'b710014298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b112',
      'application/pdf',
      '2026-02-10 10:14:00',
      'Verified',
      'GOVERNMENT OF MAHARASHTRA\nDIRECTORATE OF MAHARASHTRA FIRE SERVICES\nCertificate No: NOC/FS/MH/2025/901\nIssued To: Apex Institute of Technology & Research\nSurvey No. 42/1, Hinjawadi Pune\nValid From: 10/05/2025 to 09/05/2027',
      2,
      'GOV-MH-FIRE-NOC-901-SECURE-KEY-8819',
      'https://fire.maharashtra.gov.in/verify/NOC-FS-MH-2025-901'
    );

    insertExtraction.run('ext-1001-2-1', 'doc-1001-2', 'certificate_number', 'NOC/FS/MH/2025/901', 'NOC/FS/MH/2025/901', 0.97, 0, null, null, JSON.stringify({ page: 1, x: 100, y: 120, w: 200, h: 20 }));
    insertExtraction.run('ext-1001-2-2', 'doc-1001-2', 'issue_date', '2025-05-10', '2025-05-10', 0.95, 0, null, null, JSON.stringify({ page: 1, x: 100, y: 160, w: 120, h: 18 }));
    insertExtraction.run('ext-1001-2-3', 'doc-1001-2', 'expiry_date', '2027-05-09', '2027-05-09', 0.96, 0, null, null, JSON.stringify({ page: 1, x: 300, y: 160, w: 120, h: 18 }));
    insertExtraction.run('ext-1001-2-4', 'doc-1001-2', 'issuing_authority', 'Directorate of Maharashtra Fire Services', 'Directorate of Maharashtra Fire Services', 0.92, 0, null, null, JSON.stringify({ page: 1, x: 100, y: 80, w: 320, h: 24 }));

    insertVerif.run(
      'vr-1001-2',
      'doc-1001-2',
      'Authorized Issuer Record Lookup (API Setu / State Board)',
      'State Fire Service Portal (Mock API Setu Adapter)',
      'NOC/FS/MH/2025/901',
      'Verified',
      1,
      JSON.stringify({ match_score: 1.0, database_status: 'Active', issuer_record_match: true }),
      '2026-02-10 10:36:00',
      'State Fire Service Gateway'
    );

    // APP-2026-1003: Expired Fire Safety NOC
    insertDoc.run(
      'doc-1003-1',
      'APP-2026-1003',
      'Fire Safety NOC',
      'Delhi_Fire_Service_NOC_2021.pdf',
      '/uploads/dfs_noc_vidyasagar.pdf',
      418900,
      'c821014298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b774',
      'application/pdf',
      '2026-02-14 13:50:00',
      'Discrepancy Detected',
      'GOVERNMENT OF NCT OF DELHI\nHEADQUARTERS: DELHI FIRE SERVICE, CONNAUGHT CIRCUS, NEW DELHI\nNo. FS-NOC-DL-2021-884\nIssued To: Vidya Sagar Institute of Management Studies\nPushp Vihar, New Delhi - 110017\nValid for 3 years up to: 31/12/2024',
      1,
      'DFS-NOC-DL-2021-884-VERIFY-DFS-GOV',
      'https://dfs.delhigovt.nic.in/verify/FS-NOC-DL-2021-884'
    );

    insertExtraction.run('ext-1003-1-1', 'doc-1003-1', 'certificate_number', 'FS-NOC-DL-2021-884', 'FS-NOC-DL-2021-884', 0.96, 0, null, null, null);
    insertExtraction.run('ext-1003-1-2', 'doc-1003-1', 'expiry_date', '2024-12-31', '2024-12-31', 0.99, 0, null, null, null);
    insertExtraction.run('ext-1003-1-3', 'doc-1003-1', 'institution_name', 'Vidya Sagar Institute of Management Studies', 'Vidya Sagar Institute of Management Studies', 0.95, 0, null, null, null);

    insertFinding.run(
      'find-1003-1',
      'APP-2026-1003',
      'FIND-EXP-01',
      'Expired Certificate',
      'Critical',
      'doc-1003-1',
      'Delhi_Fire_Service_NOC_2021.pdf',
      'expiry_date',
      null,
      'Current Academic Year Cutoff (2026-27)',
      'min_validity_date',
      '2024-12-31',
      '2026-06-30 or later',
      'Delhi Fire Service NOC expired on 31-Dec-2024. Regulations require valid certification covering the full 2026-27 academic session.',
      'Request current Fire Safety Inspection Certificate or valid temporary renewal endorsement from Delhi Fire Service.',
      'Unreviewed',
      null,
      null,
      null
    );

    insertVerif.run(
      'vr-1003-1',
      'doc-1003-1',
      'Authorized Issuer Record Lookup (API Setu / State Board)',
      'Delhi Fire Service Mock Adapter',
      'FS-NOC-DL-2021-884',
      'Mismatch Detected',
      1,
      JSON.stringify({ status: 'Expired', expired_days_ago: 420, message: 'NOC lapsed on 31-Dec-2024' }),
      '2026-02-14 14:05:00',
      'Automated Verifier'
    );

    // APP-2026-1004: Institution ID / PID mismatch
    insertDoc.run(
      'doc-1004-1',
      'APP-2026-1004',
      'Building Safety Certificate',
      'Bihar_PWD_Building_Safety_Cert.pdf',
      '/uploads/pwd_building_nalanda.pdf',
      620100,
      'a911014298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b339',
      'application/pdf',
      '2026-02-15 16:00:00',
      'Discrepancy Detected',
      'GOVERNMENT OF BIHAR - PUBLIC WORKS DEPARTMENT\nSTRUCTURAL FITNESS & BUILDING SAFETY CERTIFICATE\nCertificate Reference: PWD/BLDG/PAT/2023/110\nAICTE PID: 1-9876543\nName: Nalanda Polytechnic College, Khagaul Road, Danapur\nStructure Certified Safe for Educational Occupancy.',
      2,
      'BIHAR-PWD-PAT-110-SECURE-KEY',
      'https://pwd.bihar.gov.in/verify/PWD-BLDG-PAT-2023-110'
    );

    insertExtraction.run('ext-1004-1-1', 'doc-1004-1', 'institution_pid', '1-9876543', '1-9876543', 0.99, 0, null, null, null);
    insertExtraction.run('ext-1004-1-2', 'doc-1004-1', 'institution_name', 'Nalanda Polytechnic College', 'Nalanda Polytechnic College', 0.94, 0, null, null, null);

    insertFinding.run(
      'find-1004-1',
      'APP-2026-1004',
      'FIND-PID-01',
      'Identifier Mismatch',
      'High',
      'doc-1004-1',
      'Bihar_PWD_Building_Safety_Cert.pdf',
      'institution_pid',
      null,
      'Application Form Institutional Profile',
      'current_pid',
      '1-9876543',
      '1-628471092',
      'The Building Safety Certificate states AICTE PID 1-9876543, which does not match the active institutional PID 1-628471092 registered in the portal.',
      'Require applicant to furnish State PWD certificate re-issued with the correct active AICTE PID, or provide official gazette change notification.',
      'Unreviewed',
      null,
      null,
      null
    );

    // APP-2026-1005: Intake Mismatch
    insertDoc.run(
      'doc-1005-1',
      'APP-2026-1005',
      'Affiliating University NOC',
      'GTU_Affiliation_Order_2026_27.pdf',
      '/uploads/gtu_affl_saraswati.pdf',
      712000,
      'f441014298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b558',
      'application/pdf',
      '2026-02-16 11:45:00',
      'Discrepancy Detected',
      'GUJARAT TECHNOLOGICAL UNIVERSITY, AHMEDABAD\nOrder No: GTU/AFF/PHARM/2026/89\nSubject: Extension of Affiliation for Academic Year 2026-27\nTo: Saraswati Institute of Pharmaceutical Sciences, Gandhinagar\nApproved Programmes and Sanctioned Intake:\n1. B.Pharm - 60 Seats (Sixty Only)\n2. M.Pharm (Pharmaceutics) - 15 Seats',
      3,
      'GTU-AFFL-2026-89-VERIFY-TOKEN',
      'https://gtu.ac.in/affiliation/verify/GTU-AFF-PHARM-2026-89'
    );

    insertExtraction.run('ext-1005-1-1', 'doc-1005-1', 'course_bpharm_intake', '60', '60', 0.98, 0, null, null, null);
    insertExtraction.run('ext-1005-1-2', 'doc-1005-1', 'sanctioning_university', 'Gujarat Technological University', 'Gujarat Technological University', 0.96, 0, null, null, null);

    insertFinding.run(
      'find-1005-1',
      'APP-2026-1005',
      'FIND-INTAKE-01',
      'Intake Discrepancy',
      'Critical',
      'doc-1005-1',
      'GTU_Affiliation_Order_2026_27.pdf',
      'course_bpharm_intake',
      null,
      'Application Step 2 (Proposed Intake)',
      'proposed_intake.B.Pharm',
      '60 Seats (Sanctioned by Affiliating University)',
      '120 Seats (Requested in AICTE Portal Application)',
      'Proposed intake (120) exceeds the legally sanctioned intake cap (60) stipulated in the statutory Gujarat Technological University Affiliation Order.',
      'Curtail proposed intake to 60 or request university revised intake approval letter complying with AICTE norms.',
      'Unreviewed',
      null,
      null,
      null
    );

    // APP-2026-1006: Duplicate Document SHA-256 Hash
    insertDoc.run(
      'doc-1006-1',
      'APP-2026-1006',
      'Land Ownership / Lease Deed',
      'Registered_Land_Deed_Godavari.pdf',
      '/uploads/duplicate_test_godavari.pdf',
      984000,
      'hash_shared_duplicate_sha256_88192837492817293847192837492817',
      'application/pdf',
      '2026-02-17 14:50:00',
      'Discrepancy Detected',
      'GOVERNMENT OF ANDHRA PRADESH - REGISTRATION & STAMPS DEPT\nRegistered Sale Deed No: 4920/2005\nSurvey No: 142/A, Madhurawada Visakhapatnam\nArea: 15.0 Acres Contiguous Land',
      5,
      null,
      null
    );

    insertDoc.run(
      'doc-1006-2',
      'APP-2026-1006',
      'Building Safety Certificate',
      'AP_R&B_Structural_Safety_Cert.pdf',
      '/uploads/duplicate_test_godavari.pdf',
      984000,
      'hash_shared_duplicate_sha256_88192837492817293847192837492817',
      'application/pdf',
      '2026-02-17 14:52:00',
      'Discrepancy Detected',
      'GOVERNMENT OF ANDHRA PRADESH - REGISTRATION & STAMPS DEPT\nRegistered Sale Deed No: 4920/2005\nSurvey No: 142/A, Madhurawada Visakhapatnam\nArea: 15.0 Acres Contiguous Land',
      5,
      null,
      null
    );

    insertFinding.run(
      'find-1006-1',
      'APP-2026-1006',
      'FIND-DUP-01',
      'Duplicate File Hash',
      'High',
      'doc-1006-1',
      'Registered_Land_Deed_Godavari.pdf',
      'file_hash_sha256',
      'doc-1006-2',
      'AP_R&B_Structural_Safety_Cert.pdf',
      'file_hash_sha256',
      'hash_shared_duplicate_sha256_88192837492817293847192837492817',
      'Distinct Unique File Hash',
      'Identical file payload uploaded under both "Land Ownership / Lease Deed" and "Building Safety Certificate". The Building Safety Certificate is missing genuine content.',
      'Notify applicant to upload genuine certified Structural / Building Safety Certificate issued by State PWD / Roads & Buildings.',
      'Unreviewed',
      null,
      null,
      null
    );

    // APP-2026-1007: Invalid Digital Signature & Suspicious Metadata
    insertDoc.run(
      'doc-1007-1',
      'APP-2026-1007',
      'Building Safety Certificate',
      'Himalaya_Bldg_Safety_Cert_Altered.pdf',
      '/uploads/altered_himalaya.pdf',
      450200,
      'b8192837492817293847192837492817e3b0c44298fc1c149afbf4c8996fb924',
      'application/pdf',
      '2026-02-18 09:15:00',
      'Discrepancy Detected',
      'STATE DISASTER MANAGEMENT & PWD UTTARAKHAND\nBuilding Safety Certificate: UK-PWD-DDN-2025-44\nInstitute: Himalaya Institute of Computer Applications, Dehradun\nValidity extended up to: 31/12/2028',
      1,
      null,
      null
    );

    insertFinding.run(
      'find-1007-1',
      'APP-2026-1007',
      'FIND-DSC-01',
      'Invalid Digital Signature',
      'Critical',
      'doc-1007-1',
      'Himalaya_Bldg_Safety_Cert_Altered.pdf',
      'digital_signature_chain',
      null,
      'CCA India Accredited Trust Store',
      'root_ca_authority',
      'Self-Signed Certificate (Subject: DevTest Self-Signed CA)',
      'Accredited Class 3 CA (eMudhra / NSDL / Capricorn)',
      'Digital signature validation failed: The embedded cryptographic signature was signed by an untrusted, self-signed certificate not listed in the Controller of Certifying Authorities (CCA) India Trust Store.',
      'Reject document signature and mandate re-signing through authorized government e-Sign / Class 3 DSC token.',
      'Unreviewed',
      null,
      null,
      null
    );

    insertVerif.run(
      'vr-1007-1',
      'doc-1007-1',
      'Digital Signature Validation',
      'CCA India Trust Store Verification Adapter',
      'DSC-ID-HIMALAYA-99',
      'Invalid Digital Signature',
      1,
      JSON.stringify({ failure_code: 'ERR_UNTRUSTED_ROOT', reason: 'Self-signed CA not recognized', algorithm: 'RSA-2048 with SHA256' }),
      '2026-02-18 09:32:00',
      'DSC Adapter'
    );

    // APP-2026-1008: External Registry Unavailable
    insertDoc.run(
      'doc-1008-1',
      'APP-2026-1008',
      'Land Ownership / Lease Deed',
      'Telangana_Dharani_Land_Passbook.pdf',
      '/uploads/ts_land_deccan.pdf',
      780400,
      'c9192837492817293847192837492817e3b0c44298fc1c149afbf4c8996fb924',
      'application/pdf',
      '2026-02-19 14:30:00',
      'Pending External Verification',
      'GOVERNMENT OF TELANGANA - DHARANI PORTAL\nE-Passbook / Title Deed: TS/RR/GAC/2019/8812\nSurvey No: 88, Financial District, Gachibowli\nOwner: Deccan Educational Society\nArea: 3.50 Acres',
      4,
      'DHARANI-TS-RR-8812-PASSBOOK-TOKEN',
      'https://dharani.telangana.gov.in/verify/TS-RR-GAC-2019-8812'
    );

    insertVerif.run(
      'vr-1008-1',
      'doc-1008-1',
      'Authorized Issuer Record Lookup (API Setu / State Board)',
      'Telangana Dharani Land Portal (API Setu Adapter)',
      'TS/RR/GAC/2019/8812',
      'Pending Verification',
      1,
      JSON.stringify({ status: 'HTTP 503 Service Unavailable', retry_scheduled_at: '2026-02-27 18:00:00', attempts: 3, note: 'External state registry endpoint maintenance' }),
      '2026-02-19 14:48:00',
      'Automated Gateway'
    );

    insertFinding.run(
      'find-1008-1',
      'APP-2026-1008',
      'FIND-EXT-01',
      'External Source Unavailable',
      'Medium',
      'doc-1008-1',
      'Telangana_Dharani_Land_Passbook.pdf',
      'issuer_verification_status',
      null,
      'API Setu Dharani Service Gateway',
      'http_status',
      'HTTP 503 (Source Temporarily Unavailable)',
      'HTTP 200 (Record Verified)',
      'Authoritative State Land Revenue database could not be reached to verify title deed ownership. Automatic exponential backoff retry active.',
      'Allow automated scheduler to poll API Setu, or route to AICTE Revenue officer for manual physical verification if outage persists.',
      'Unreviewed',
      null,
      null,
      null
    );

    // 7. Infrastructure Evidence (Campus, labs, workshops, floor plans)
    const insertInfra = db.prepare(`
      INSERT INTO infrastructure_evidence (id, application_id, category, title, file_name, file_path, file_size, latitude, longitude, geo_location_name, capture_date, detected_elements_json, review_status, reviewer_notes, is_duplicate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // For APP-2026-1001 (Clean Application)
    insertInfra.run(
      'infra-1001-1',
      'APP-2026-1001',
      'Computer Laboratory',
      'Advanced AI & HPC Computing Laboratory (Lab 04)',
      'Apex_Computer_Lab_4.jpg',
      'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
      2400100,
      18.5913,
      73.7389,
      'Hinjawadi Phase 2, Pune, Maharashtra',
      '2026-01-20 11:15:00',
      JSON.stringify(['72 Desktop Workstations', 'CAT-6 Structured Cabling', 'Dual 100 Mbps Fibre ONT', 'Surveillance Camera', 'Central Air Conditioning']),
      'Verified',
      'Normative computer lab requirements met: >= 60 high-performance terminals, legitimate LAN switchboard.',
      0
    );

    insertInfra.run(
      'infra-1001-2',
      'APP-2026-1001',
      'Campus Aerial / Front View',
      'Main Academic Complex & Administrative Block',
      'Apex_Main_Academic_Block.jpg',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
      3100200,
      18.5915,
      73.7385,
      'Hinjawadi Phase 2, Pune, Maharashtra',
      '2026-01-20 10:45:00',
      JSON.stringify(['Barrier-free Ramp Access', 'Bilingual AICTE Signboard', '5-Storey RCC Structure', 'Fire Hydrant Pillar']),
      'Verified',
      'Geo-coordinates accurately align within 12 meters of registered parcel boundary.',
      0
    );

    insertInfra.run(
      'infra-1001-3',
      'APP-2026-1001',
      'Central Library',
      'Central Reading Room & Digital Reference Stacks',
      'Apex_Central_Library.jpg',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800',
      2890000,
      18.5912,
      73.7391,
      'Hinjawadi Phase 2, Pune, Maharashtra',
      '2026-01-20 14:00:00',
      JSON.stringify(['180 Seating Capacity', 'Kohas Open Source ILS', 'IEEE/Springer Digital Terminal Stacks', 'Fire Extinguishers']),
      'Verified',
      'Sufficient seating capacity and e-journal subscription infrastructure confirmed.',
      0
    );

    // For APP-2026-1010 (Inspection Recommended - Geo mismatch & missing equipment)
    insertInfra.run(
      'infra-1010-1',
      'APP-2026-1010',
      'Computer Laboratory',
      'Proposed Computing Centre Room 201',
      'Kaveri_Proposed_Lab.jpg',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      1980000,
      12.8399,
      77.6770,
      'Electronic City Phase 1, Bengaluru (Deviates >150km from claimed rural campus in Tumakuru)',
      '2026-02-18 16:30:00',
      JSON.stringify(['12 Laptops', 'Unmounted Network Switch', 'Absence of Permanent Power Backups']),
      'Potential Discrepancy',
      'EXIF GPS metadata points to Bengaluru IT park rather than the approved college location. Potential rented demo lab.',
      0
    );

    insertInfra.run(
      'infra-1010-2',
      'APP-2026-1010',
      'Engineering Workshop',
      'Mechanical & Foundry Workshop Shed',
      'Kaveri_Mech_Workshop.jpg',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
      2150000,
      13.3400,
      77.1000,
      'Tumakuru Highway, Karnataka',
      '2026-02-19 11:00:00',
      JSON.stringify(['Empty Floor Space', 'Absence of Lathe / CNC Milling Machines', 'Uninstalled Transformer']),
      'Needs Physical Inspection',
      'Crucial AICTE-mandated workshop machinery not detected in uploaded evidence. Physical inspection committee required.',
      0
    );

    // 8. Compliance Evaluations for Seeded Apps
    const insertEval = db.prepare(`
      INSERT INTO compliance_evaluations (id, application_id, rule_id, rule_version, status, evidence_found, explanation, corrective_action, evaluated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Evaluations for APP-2026-1001 (Clean App)
    insertEval.run('eval-1001-1', 'APP-2026-1001', 'rule-001', 1, 'Passed', '4 mandatory documents present and verified.', 'All required documents for Extension of Approval are uploaded.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-2', 'APP-2026-1001', 'rule-002', 1, 'Passed', 'Fire NOC valid until 09-May-2027.', 'Fire Safety NOC is active and covers 2026-27 academic term.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-3', 'APP-2026-1001', 'rule-003', 1, 'Passed', 'PID 1-348911029 matches consistently.', 'Institutional PID matches across AICTE EOA, Fire NOC and Affiliation letter.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-4', 'APP-2026-1001', 'rule-004', 1, 'Passed', 'Total proposed intake (420) <= University sanctioned intake (420).', 'Sanctioned intake cap strictly adhered to.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-5', 'APP-2026-1001', 'rule-005', 1, 'Not Applicable', 'Land norms checked during initial establishment.', 'Category is Extension of Approval on existing certified campus.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-6', 'APP-2026-1001', 'rule-006', 1, 'Passed', 'Distinct cryptographic SHA-256 hashes for all files.', 'No duplicate document uploads detected.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-7', 'APP-2026-1001', 'rule-007', 1, 'Passed', 'Class 3 DSC certificate verified with eMudhra CA.', 'Authorized Registrar electronic signature valid and intact.', 'None required.', '2026-02-10 10:40:00');
    insertEval.run('eval-1001-8', 'APP-2026-1001', 'rule-008', 1, 'Passed', 'Lab & campus coordinates within 15 meters of cadastral map.', 'Infrastructure evidence geotags valid.', 'None required.', '2026-02-10 10:40:00');

    // Evaluations for APP-2026-1003 (Expired Fire NOC)
    insertEval.run('eval-1003-1', 'APP-2026-1003', 'rule-001', 1, 'Passed', 'Mandatory documents uploaded.', 'Document checklist fulfilled.', 'None.', '2026-02-14 14:10:00');
    insertEval.run('eval-1003-2', 'APP-2026-1003', 'rule-002', 1, 'Failed', 'Fire NOC lapsed on 31-Dec-2024.', 'Document has expired before the beginning of the 2026-27 academic session.', 'Upload current valid Fire Safety Certificate or renewal endorsement.', '2026-02-14 14:10:00');
    insertEval.run('eval-1003-3', 'APP-2026-1003', 'rule-003', 1, 'Passed', 'PID matches institutional record.', 'No PID discrepancy.', 'None.', '2026-02-14 14:10:00');
    insertEval.run('eval-1003-4', 'APP-2026-1003', 'rule-004', 1, 'Passed', 'Intake 240 seats conforms to MBA sanction.', 'Intake compliant.', 'None.', '2026-02-14 14:10:00');

    // 9. Initial Audit Events (Demonstrating tamper-evident logging)
    const insertAudit = db.prepare(`
      INSERT INTO audit_events (id, timestamp, actor_name, actor_role, application_id, action, target_type, target_ref, outcome, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run('aud-001', '2026-02-10 10:10:00', 'Dr. Rajesh Sharma', 'applicant', 'APP-2026-1001', 'APPLICATION_CREATED', 'Application', 'APP-2026-1001', 'Success', JSON.stringify({ category: 'Extension of Approval', academic_year: '2026-27' }), '103.21.124.55');
    insertAudit.run('aud-002', '2026-02-10 10:15:00', 'Dr. Rajesh Sharma', 'applicant', 'APP-2026-1001', 'DOCUMENT_UPLOADED', 'Document', 'doc-1001-1', 'Success', JSON.stringify({ file_name: 'AICTE_EOA_Order_2025_26.pdf', size_bytes: 842100 }), '103.21.124.55');
    insertAudit.run('aud-003', '2026-02-10 10:25:00', 'Dr. Rajesh Sharma', 'applicant', 'APP-2026-1001', 'DOCUMENT_UPLOADED', 'Document', 'doc-1001-2', 'Success', JSON.stringify({ file_name: 'Fire_Safety_NOC_Pune_2025.pdf', size_bytes: 512400 }), '103.21.124.55');
    insertAudit.run('aud-004', '2026-02-10 10:30:00', 'Dr. Rajesh Sharma', 'applicant', 'APP-2026-1001', 'APPLICATION_SUBMITTED', 'Application', 'APP-2026-1001', 'Success', JSON.stringify({ dsc_signed: true, signer: 'Dr. Suresh V. Kulkarni' }), '103.21.124.55');
    insertAudit.run('aud-005', '2026-02-10 10:35:00', 'Automated Verification Engine', 'system', 'APP-2026-1001', 'VALIDATION_RUN_COMPLETED', 'ValidationRun', 'VR-RUN-1001', 'Success', JSON.stringify({ score: 5, risk_level: 'Low', passed_rules: 7, na_rules: 1, failed_rules: 0 }), '127.0.0.1');
    insertAudit.run('aud-006', '2026-02-15 14:15:00', 'Smt. Anita Deshmukh', 'reviewer', 'APP-2026-1001', 'PRELIMINARY_SCRUTINY_COMPLETED', 'Application', 'APP-2026-1001', 'Success', JSON.stringify({ recommendation: 'Ready for Official Committee Sanction' }), '164.100.24.12');

    insertAudit.run('aud-007', '2026-02-14 14:00:00', 'Dr. Meenakshi Soni', 'applicant', 'APP-2026-1003', 'APPLICATION_SUBMITTED', 'Application', 'APP-2026-1003', 'Success', JSON.stringify({ category: 'Extension of Approval' }), '115.112.89.21');
    insertAudit.run('aud-008', '2026-02-14 14:05:00', 'Automated Verification Engine', 'system', 'APP-2026-1003', 'DISCREPANCY_FLAGGED', 'Finding', 'find-1003-1', 'Deficiency', JSON.stringify({ type: 'Expired Certificate', certificate: 'FS-NOC-DL-2021-884' }), '127.0.0.1');

    // 10. Initial Notifications
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_role, title, message, application_id, type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run('notif-1', 'reviewer', 'New Application Submitted', 'Apex Institute of Technology submitted Extension of Approval application APP-2026-1001.', 'APP-2026-1001', 'info', 0, '2026-02-10 10:31:00');
    insertNotif.run('notif-2', 'reviewer', 'High Risk Application Flagged', 'Himalaya Institute application APP-2026-1007 flagged with Risk Score 85 (Untrusted Digital Signature).', 'APP-2026-1007', 'error', 0, '2026-02-18 09:35:00');
    insertNotif.run('notif-3', 'applicant', 'Validation Deficiency Notice', 'Fire Safety NOC for application APP-2026-1003 appears expired. Please provide updated certificate.', 'APP-2026-1003', 'warning', 0, '2026-02-14 14:15:00');
    insertNotif.run('notif-4', 'admin', 'Rule Engine Updated', 'AICTE-RULE-FIRE-02 version 1 loaded into compliance engine.', null, 'success', 1, '2026-01-01 00:00:00');
    insertNotif.run('notif-5', 'reviewer', 'External Verification Unavailable', 'API Setu Dharani endpoint timed out for Deccan College application APP-2026-1008.', 'APP-2026-1008', 'warning', 0, '2026-02-19 14:50:00');

    db.exec('COMMIT;');
    console.log('[Seed] Database populated successfully with all 8 institutions, 12 applications, rules, and records!');
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('[Seed Error] Failed to seed database:', error);
    throw error;
  }
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
