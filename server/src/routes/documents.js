const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const {
  calculateFileHash,
  extractTextFromFile,
  classifyDocumentType,
  extractStructuredFields,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
} = require('../services/documentProcessor');
const { runDocumentVerification } = require('../services/verificationEngine');
const { runCrossDocumentChecks } = require('../services/crossDocumentEngine');
const { runComplianceEvaluation } = require('../services/complianceEngine');
const { calculateRiskScore } = require('../services/anomalyScorer');
const { logAuditEvent } = require('../services/auditLogger');

// Configure Multer storage
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${uuidv4().slice(0, 6)}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: PDF, JPG, PNG, WEBP.'));
    }
  }
});

// Upload supporting document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { application_id, document_type, actor_name = 'Institution Applicant', actor_role = 'applicant' } = req.body;
    if (!application_id) {
      return res.status(400).json({ success: false, message: 'application_id is required' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = calculateFileHash(fileBuffer);
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;

    // Extract text
    const { text, pageCount } = await extractTextFromFile(filePath, mimeType);

    // Classification (either user-selected or auto-classified)
    const classifiedType = document_type && document_type !== 'Auto-Detect'
      ? document_type
      : classifyDocumentType(originalName, text);

    const docId = `doc-${uuidv4().slice(0, 8)}`;
    const relativeUrl = `/uploads/${path.basename(filePath)}`;

    // Simulated QR extraction if text has URL or keyword
    let qrText = null;
    let qrUrl = null;
    if (text.includes('https://') || text.includes('verify')) {
      const match = text.match(/https?:\/\/[^\s]+/i);
      if (match) {
        qrText = match[0];
        qrUrl = match[0];
      }
    }

    db.prepare(`
      INSERT INTO documents (
        id, application_id, document_type, file_name, file_path, file_size,
        file_hash_sha256, mime_type, upload_date, status, extracted_text,
        page_count, qr_decoded_text, qr_source_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'Processing', ?, ?, ?, ?)
    `).run(
      docId,
      application_id,
      classifiedType,
      originalName,
      relativeUrl,
      fileSize,
      fileHash,
      mimeType,
      text,
      pageCount,
      qrText,
      qrUrl
    );

    // Extract structured fields
    const fields = extractStructuredFields(text, classifiedType);
    const insertExt = db.prepare(`
      INSERT INTO document_extractions (
        id, document_id, field_name, original_value, current_value,
        confidence_score, is_overridden, overridden_by, override_reason
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL)
    `);

    for (const f of fields) {
      insertExt.run(
        `ext-${uuidv4().slice(0, 8)}`,
        docId,
        f.fieldName,
        f.value,
        f.value,
        f.confidence
      );
    }

    // Run verification adapters
    runDocumentVerification(docId, actor_name);

    // Run cross-document consistency checks & compliance evaluation
    runCrossDocumentChecks(application_id);
    runComplianceEvaluation(application_id);
    calculateRiskScore(application_id);

    // Audit log
    logAuditEvent({
      actor_name,
      actor_role,
      application_id,
      action: 'DOCUMENT_UPLOADED',
      target_type: 'Document',
      target_ref: docId,
      outcome: 'Success',
      details: {
        file_name: originalName,
        document_type: classifiedType,
        file_hash_sha256: fileHash,
        file_size_bytes: fileSize,
        extracted_fields_count: fields.length
      }
    });

    res.json({
      success: true,
      message: 'Document uploaded, OCR extracted, and verification completed',
      document: {
        id: docId,
        fileName: originalName,
        documentType: classifiedType,
        fileSize,
        fileHash,
        extractedFields: fields
      }
    });
  } catch (err) {
    console.error('[Document Upload Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update/Correct extracted field (Reviewer OCR correction with audit record)
router.put('/:docId/extractions/:extId', (req, res) => {
  try {
    const { docId, extId } = req.params;
    const { corrected_value, override_reason, actor_name = 'AICTE Reviewer', actor_role = 'reviewer' } = req.body;

    if (!corrected_value || !override_reason) {
      return res.status(400).json({ success: false, message: 'corrected_value and override_reason are required' });
    }

    const ext = db.prepare('SELECT e.*, d.application_id, d.file_name FROM document_extractions e JOIN documents d ON e.document_id = d.id WHERE e.id = ? AND e.document_id = ?').get(extId, docId);
    if (!ext) {
      return res.status(404).json({ success: false, message: 'Extracted field record not found' });
    }

    db.prepare(`
      UPDATE document_extractions
      SET current_value = ?, is_overridden = 1, overridden_by = ?, override_reason = ?
      WHERE id = ?
    `).run(corrected_value, actor_name, override_reason, extId);

    // Log the correction audit trail
    logAuditEvent({
      actor_name,
      actor_role,
      application_id: ext.application_id,
      action: 'OCR_EXTRACTION_CORRECTED',
      target_type: 'DocumentExtraction',
      target_ref: extId,
      outcome: 'Success',
      details: {
        field_name: ext.field_name,
        original_value: ext.original_value,
        corrected_value,
        override_reason,
        document_file: ext.file_name
      }
    });

    // Re-run cross-document checks with corrected value
    runCrossDocumentChecks(ext.application_id);
    runComplianceEvaluation(ext.application_id);
    calculateRiskScore(ext.application_id);

    res.json({
      success: true,
      message: 'Extracted field updated. Cross-document consistency re-evaluated.',
      extraction: {
        id: extId,
        fieldName: ext.field_name,
        originalValue: ext.original_value,
        currentValue: corrected_value,
        isOverridden: 1,
        overriddenBy: actor_name,
        overrideReason: override_reason
      }
    });
  } catch (err) {
    console.error('[Update Extraction Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete document
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    // Re-run checks
    runCrossDocumentChecks(doc.application_id);
    runComplianceEvaluation(doc.application_id);
    calculateRiskScore(doc.application_id);

    logAuditEvent({
      actor_name: 'Institution Applicant',
      actor_role: 'applicant',
      application_id: doc.application_id,
      action: 'DOCUMENT_REMOVED',
      target_type: 'Document',
      target_ref: id,
      outcome: 'Success',
      details: { file_name: doc.file_name, document_type: doc.document_type }
    });

    res.json({ success: true, message: 'Document removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
