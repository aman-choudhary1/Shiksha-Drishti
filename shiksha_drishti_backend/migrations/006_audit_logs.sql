-- ==========================================================================
-- 006_audit_logs.sql
-- Audit trail for all important data changes.
-- Required for government/education system accountability.
-- ==========================================================================

\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS sd_audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT REFERENCES sd_users(id) ON DELETE SET NULL,
  username      TEXT,                 -- snapshot at time of action
  action        TEXT NOT NULL,       -- CREATE | UPDATE | DELETE | SUBMIT | REOPEN | LOGIN | LOGOUT
  entity_type   TEXT NOT NULL,       -- assessment | subject_marks | question_marks | user
  entity_id     BIGINT,
  old_value     JSONB,               -- previous state snapshot
  new_value     JSONB,               -- new state snapshot
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_audit_entity  ON sd_audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sd_audit_user    ON sd_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_sd_audit_created ON sd_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sd_audit_action  ON sd_audit_logs (action);
