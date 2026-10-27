const { db } = require('../db');

function calculateRiskScore(applicationId) {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(applicationId);
  if (!app) return { score: 0, level: 'Low', factors: [] };

  const findings = db.prepare(`
    SELECT * FROM cross_document_findings
    WHERE application_id = ? AND reviewer_disposition IN ('Unreviewed', 'Confirmed Discrepancy')
  `).all(applicationId);

  const docs = db.prepare('SELECT * FROM documents WHERE application_id = ?').all(applicationId);
  const infraFlags = db.prepare(`
    SELECT * FROM infrastructure_evidence
    WHERE application_id = ? AND review_status IN ('Potential Discrepancy', 'Needs Physical Inspection')
  `).all(applicationId);

  let rawScore = 0;
  const factors = [];

  // Factor 1: Unresolved Critical Findings (+30 pts each, cap 60)
  const criticalFindings = findings.filter(f => f.severity === 'Critical');
  if (criticalFindings.length > 0) {
    const pts = Math.min(criticalFindings.length * 30, 60);
    rawScore += pts;
    factors.push({
      category: 'Regulatory Deficiency',
      severity: 'Critical',
      points: pts,
      description: `${criticalFindings.length} Critical Finding(s) detected: ${criticalFindings.map(f => f.finding_type).join(', ')}`
    });
  }

  // Factor 2: Unresolved High Severity Findings (+20 pts each, cap 40)
  const highFindings = findings.filter(f => f.severity === 'High');
  if (highFindings.length > 0) {
    const pts = Math.min(highFindings.length * 20, 40);
    rawScore += pts;
    factors.push({
      category: 'Inconsistency',
      severity: 'High',
      points: pts,
      description: `${highFindings.length} High-severity discrepancy(ies): ${highFindings.map(f => f.finding_type).join(', ')}`
    });
  }

  // Factor 3: Medium Severity Findings (+10 pts each, cap 20)
  const medFindings = findings.filter(f => f.severity === 'Medium');
  if (medFindings.length > 0) {
    const pts = Math.min(medFindings.length * 10, 20);
    rawScore += pts;
    factors.push({
      category: 'Pending Verification',
      severity: 'Medium',
      points: pts,
      description: `${medFindings.length} External verification or heuristic alert(s) awaiting resolution.`
    });
  }

  // Factor 4: Missing Mandatory Documents (+25 pts each)
  if (app.missing_doc_count > 0) {
    const pts = Math.min(app.missing_doc_count * 25, 50);
    rawScore += pts;
    factors.push({
      category: 'Incompleteness',
      severity: 'Critical',
      points: pts,
      description: `${app.missing_doc_count} mandatory document(s) missing from application submission.`
    });
  }

  // Factor 5: Infrastructure Evidence Discrepancies (+20 pts each)
  if (infraFlags.length > 0) {
    const pts = Math.min(infraFlags.length * 20, 40);
    rawScore += pts;
    factors.push({
      category: 'Physical Infrastructure',
      severity: 'High',
      points: pts,
      description: `${infraFlags.length} infrastructure item(s) flagged for geolocation or machinery inspection.`
    });
  }

  // Factor 6: Favorable verification bonus (-10 pts if documents verified)
  const verifiedDocs = docs.filter(d => d.status === 'Verified');
  if (verifiedDocs.length >= 2 && rawScore > 0) {
    rawScore = Math.max(0, rawScore - 10);
    factors.push({
      category: 'Corroborating Evidence',
      severity: 'Positive',
      points: -10,
      description: `${verifiedDocs.length} document(s) independently verified through Class 3 DSC / mock issuer registry.`
    });
  }

  const finalScore = Math.min(100, Math.max(0, rawScore));

  let level = 'Low';
  if (finalScore >= 75) level = 'Critical';
  else if (finalScore >= 50) level = 'High';
  else if (finalScore >= 25) level = 'Medium';
  else level = 'Low';

  // Update in database
  db.prepare('UPDATE applications SET risk_score = ?, risk_level = ? WHERE id = ?').run(finalScore, level, applicationId);

  return {
    score: finalScore,
    level,
    factors,
    disclaimer: 'DECISION-SUPPORT NOTICE: This weighted risk score is a deterministic heuristic prioritizing scrutiny. It does NOT represent a statistically calibrated probability of fraud. Final regulatory approval or rejection rests solely with authorized AICTE officials.'
  };
}

module.exports = {
  calculateRiskScore
};
