const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

function logAuditEvent({
  actor_name = 'System',
  actor_role = 'system',
  application_id = null,
  action,
  target_type = null,
  target_ref = null,
  outcome = 'Success',
  details = {},
  ip_address = '127.0.0.1'
}) {
  try {
    const id = `aud-${uuidv4().slice(0, 8)}`;
    const stmt = db.prepare(`
      INSERT INTO audit_events (
        id, timestamp, actor_name, actor_role, application_id, action,
        target_type, target_ref, outcome, details_json, ip_address
      )
      VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      actor_name,
      actor_role,
      application_id,
      action,
      target_type,
      target_ref,
      outcome,
      JSON.stringify(details),
      ip_address
    );

    return id;
  } catch (err) {
    console.error('[Audit Logger Error]', err);
    return null;
  }
}

function getAuditLogs({ application_id, actor_role, action, search, limit = 50, offset = 0 } = {}) {
  let query = 'SELECT * FROM audit_events WHERE 1=1';
  const params = [];

  if (application_id) {
    query += ' AND application_id = ?';
    params.push(application_id);
  }
  if (actor_role) {
    query += ' AND actor_role = ?';
    params.push(actor_role);
  }
  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (search) {
    query += ' AND (actor_name LIKE ? OR action LIKE ? OR target_ref LIKE ? OR outcome LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    details: r.details_json ? JSON.parse(r.details_json) : {}
  }));
}

module.exports = {
  logAuditEvent,
  getAuditLogs
};
