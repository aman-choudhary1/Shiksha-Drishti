/**
 * auditLog: Writes an entry to sd_audit_logs.
 * Called from controllers after any important data mutation.
 */
const pool = require('../config/db');

async function auditLog({ userId, username, action, entityType, entityId, oldValue, newValue, req }) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    const ua = req?.headers?.['user-agent'] || null;
    await pool.query(
      `INSERT INTO sd_audit_logs
         (user_id, username, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        userId || null,
        username || null,
        action,
        entityType,
        entityId || null,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ip,
        ua,
      ]
    );
  } catch (err) {
    // Never let audit logging break the main flow
    console.error('[SD-Audit] Failed to write audit log:', err.message);
  }
}

module.exports = { auditLog };
