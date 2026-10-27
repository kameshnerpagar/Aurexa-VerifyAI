const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Pluggable Verification Adapter Interface
 * All adapters return: { result, sourceAuthority, referenceId, details, isSimulated: true }
 */

// Adapter 1: Digital Signature Validation
function verifyDigitalSignatureAdapter(doc, extractions = {}) {
  const fileName = doc.file_name.toLowerCase();

  // Test case for invalid signature
  if (fileName.includes('altered') || fileName.includes('himalaya') || fileName.includes('fake')) {
    return {
      result: 'Invalid Digital Signature',
      sourceAuthority: 'CCA India National Trust Store (Simulated Adapter)',
      referenceId: 'DSC-REVOKED-TEST-99',
      details: {
        status: 'Invalid Digital Signature',
        reason: 'Embedded X.509 certificate was self-signed and is not signed by a recognized Indian Certifying Authority (eMudhra, NSDL, (n)Code).',
        signer: 'Unknown / Dev Certificate',
        algorithm: 'RSA-2048 with SHA-256',
        limitation: 'DEMO / SIMULATED: Cryptographic check verifies digital certificate trust chain against CCA India root store.'
      }
    };
  }

  return {
    result: 'Verified',
    sourceAuthority: 'eMudhra Class 3 Institutional CA (Simulated Adapter)',
    referenceId: `DSC-${doc.id.slice(-6).toUpperCase()}-2026`,
    details: {
      status: 'Verified',
      certificate_class: 'Class 3 Institutional Signer',
      validity: 'Valid up to 2027-12-31',
      trust_chain_verified: true,
      limitation: 'DEMO / SIMULATED: Signature integrity and trust chain verified against synthetic CCA trust store.'
    }
  };
}

// Adapter 2: Authorized Issuer-Record Verification (API Setu / State Portals)
function verifyIssuerRecordAdapter(doc, extractions = {}) {
  const certNo = extractions['certificate_number'] || '';

  // Look up in mock issuer registry
  let mockRecord = null;
  if (certNo) {
    mockRecord = db.prepare('SELECT * FROM mock_issuer_registry WHERE document_reference = ?').get(certNo);
  }

  if (!mockRecord) {
    // Try matching by document type or filename
    const lowerName = doc.file_name.toLowerCase();
    if (lowerName.includes('telangana') || lowerName.includes('dharani')) {
      mockRecord = db.prepare('SELECT * FROM mock_issuer_registry WHERE issuer_type LIKE ?').get('%Land%');
    } else if (lowerName.includes('dfs') || lowerName.includes('fire')) {
      mockRecord = db.prepare('SELECT * FROM mock_issuer_registry WHERE issuer_type = ?').get('State Fire Service');
    }
  }

  // Case 8: External service unavailable (e.g. 503)
  if (doc.file_name.toLowerCase().includes('dharani') || doc.file_name.toLowerCase().includes('telangana')) {
    return {
      result: 'Pending Verification',
      sourceAuthority: 'Telangana Dharani Land Portal (API Setu Adapter)',
      referenceId: certNo || 'TS/RR/GAC/2019/8812',
      details: {
        http_status: 'HTTP 503 Service Unavailable',
        error_message: 'External state registry endpoint maintenance or network timeout. Automatic exponential backoff active.',
        retry_count: 3,
        limitation: 'DEMO / SIMULATED: Real-world government API endpoints may experience intermittent outages or rate limits.'
      }
    };
  }

  if (mockRecord) {
    if (mockRecord.verification_status === 'Expired') {
      return {
        result: 'Mismatch Detected',
        sourceAuthority: `${mockRecord.issuer_type} Central Registry`,
        referenceId: mockRecord.document_reference,
        details: {
          status: 'Expired',
          expected_institution_name: mockRecord.expected_institution_name,
          expected_expiry_date: mockRecord.expected_expiry_date,
          remarks: mockRecord.remarks,
          limitation: 'DEMO / SIMULATED: Comparison against official state issuer records.'
        }
      };
    }

    if (mockRecord.verification_status === 'Sanctioned Mismatch') {
      return {
        result: 'Mismatch Detected',
        sourceAuthority: `${mockRecord.issuer_type} Registry`,
        referenceId: mockRecord.document_reference,
        details: {
          status: 'Mismatch Detected',
          remarks: mockRecord.remarks,
          limitation: 'DEMO / SIMULATED: University sanction record does not match application requested intake.'
        }
      };
    }

    return {
      result: 'Verified',
      sourceAuthority: `${mockRecord.issuer_type} Registry`,
      referenceId: mockRecord.document_reference,
      details: {
        status: 'Verified',
        match_score: 1.0,
        remarks: mockRecord.remarks,
        limitation: 'DEMO / SIMULATED: Authentic issuer record matched.'
      }
    };
  }

  // If no registry entry exists
  return {
    result: 'Manual Review Required',
    sourceAuthority: 'Local Mock Verifier (No Authoritative API Available)',
    referenceId: certNo || 'N/A',
    details: {
      status: 'Source Unavailable',
      reason: 'No automated issuer registry or API Setu gateway registered for this issuing body. Route to human reviewer for manual verification.',
      limitation: 'DEMO / SIMULATED: Automated check cannot verify authenticity without an authoritative API connection.'
    }
  };
}

// Adapter 3: QR Code Verification
function verifyQRCodeAdapter(doc) {
  if (!doc.qr_decoded_text && !doc.qr_source_url) {
    return {
      result: 'Manual Review Required',
      sourceAuthority: 'QR Code Decoder Subsystem',
      referenceId: 'NO-QR-CODE',
      details: {
        status: 'No Machine-Readable QR Code Found',
        message: 'No standardized 2D barcode / QR code identified in document stream.',
        limitation: 'Absence of QR code does not imply invalidity, but manual review is required if QR is mandatory.'
      }
    };
  }

  const qrText = doc.qr_decoded_text || doc.qr_source_url;
  return {
    result: 'Verified',
    sourceAuthority: 'Decoded QR Machine-Readable Stream',
    referenceId: qrText.slice(0, 40),
    details: {
      status: 'Decoded Successfully',
      raw_decoded_content: qrText,
      disclaimer: 'CRITICAL LIMITATION: Decoded QR content is displayed for convenience; decoded string alone does NOT prove authenticity without cryptographic issuer validation.'
    }
  };
}

// Main Verification Pipeline Runner
function runDocumentVerification(documentId, actorName = 'Automated Verification Engine') {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Fetch extractions for this document
  const extractionsRows = db.prepare('SELECT * FROM document_extractions WHERE document_id = ?').all(documentId);
  const extractions = {};
  for (const r of extractionsRows) {
    extractions[r.field_name] = r.current_value;
  }

  // Delete previous verification records for fresh run
  db.prepare('DELETE FROM verification_records WHERE document_id = ?').run(documentId);

  const insertRecord = db.prepare(`
    INSERT INTO verification_records (
      id, document_id, verification_method, source_authority, reference_id,
      result, is_simulated, details_json, verified_at, verified_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `);

  const results = [];

  // 1. Digital Signature Check
  const dscRes = verifyDigitalSignatureAdapter(doc, extractions);
  const id1 = `vr-${uuidv4().slice(0, 8)}`;
  insertRecord.run(
    id1,
    documentId,
    'Digital Signature Validation',
    dscRes.sourceAuthority,
    dscRes.referenceId,
    dscRes.result,
    1,
    JSON.stringify(dscRes.details),
    actorName
  );
  results.push({ ...dscRes, id: id1, method: 'Digital Signature Validation' });

  // 2. Issuer Record Lookup
  const issuerRes = verifyIssuerRecordAdapter(doc, extractions);
  const id2 = `vr-${uuidv4().slice(0, 8)}`;
  insertRecord.run(
    id2,
    documentId,
    'Authorized Issuer Record Lookup (API Setu / State Board)',
    issuerRes.sourceAuthority,
    issuerRes.referenceId,
    issuerRes.result,
    1,
    JSON.stringify(issuerRes.details),
    actorName
  );
  results.push({ ...issuerRes, id: id2, method: 'Authorized Issuer Record Lookup (API Setu / State Board)' });

  // 3. QR Code Check
  const qrRes = verifyQRCodeAdapter(doc);
  const id3 = `vr-${uuidv4().slice(0, 8)}`;
  insertRecord.run(
    id3,
    documentId,
    'QR Code Reference Check',
    qrRes.sourceAuthority,
    qrRes.referenceId,
    qrRes.result,
    1,
    JSON.stringify(qrRes.details),
    actorName
  );
  results.push({ ...qrRes, id: id3, method: 'QR Code Reference Check' });

  // Determine overall document status based on adapters
  let finalStatus = 'Verified';
  if (results.some(r => r.result === 'Invalid Digital Signature')) {
    finalStatus = 'Discrepancy Detected';
  } else if (results.some(r => r.result === 'Mismatch Detected')) {
    finalStatus = 'Discrepancy Detected';
  } else if (results.some(r => r.result === 'Pending Verification')) {
    finalStatus = 'Pending External Verification';
  } else if (results.some(r => r.result === 'Manual Review Required')) {
    finalStatus = 'Manual Review Required';
  }

  db.prepare('UPDATE documents SET status = ? WHERE id = ?').run(finalStatus, documentId);

  return {
    documentId,
    overallDocumentStatus: finalStatus,
    verificationRecords: results
  };
}

module.exports = {
  verifyDigitalSignatureAdapter,
  verifyIssuerRecordAdapter,
  verifyQRCodeAdapter,
  runDocumentVerification
};
