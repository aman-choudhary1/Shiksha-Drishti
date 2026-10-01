-- ==========================================================================
-- 007_cluster_visits.sql
-- Cluster Academic Coordinator (CAC) Monitoring & School Inspection Visits
-- ==========================================================================

\set ON_ERROR_STOP on

-- Update constraints on sd_users if they exist
DO $$
BEGIN
  -- Drop existing check constraint on role if exists
  ALTER TABLE sd_users DROP CONSTRAINT IF EXISTS sd_users_role_check;
  ALTER TABLE sd_users ADD CONSTRAINT sd_users_role_check CHECK (role IN (
    'TEACHER',
    'SCHOOL_ADMIN',
    'CAC',
    'CLUSTER_COORDINATOR',
    'BLOCK_OFFICER',
    'DISTRICT_OFFICER',
    'STATE_ADMIN',
    'DATA_ANALYST',
    'SUPER_ADMIN'
  ));

  -- Drop existing check constraint on scope_type if exists
  ALTER TABLE sd_users DROP CONSTRAINT IF EXISTS sd_users_scope_type_check;
  ALTER TABLE sd_users ADD CONSTRAINT sd_users_scope_type_check CHECK (
    scope_type IN ('school', 'cluster', 'block', 'district', 'state')
  );
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- sd_cluster_visits: School inspection and monitoring visits logged by CAC
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_cluster_visits (
  id                    BIGSERIAL PRIMARY KEY,
  cac_user_id           BIGINT REFERENCES sd_users(id) ON DELETE CASCADE,
  school_udise          BIGINT NOT NULL REFERENCES sd_schools(udise_code) ON DELETE CASCADE,
  visit_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type            TEXT NOT NULL DEFAULT 'ROUTINE'
                        CHECK (visit_type IN ('ROUTINE', 'FLN_ASSESSMENT', 'REMEDIAL_REVIEW', 'SURPRISE_INSPECTION', 'SPECIAL')),
  fln_rating            NUMERIC(3, 1) DEFAULT 4.0, -- 1.0 to 5.0
  infrastructure_rating NUMERIC(3, 1) DEFAULT 4.0, -- 1.0 to 5.0
  teacher_attendance_pct INT DEFAULT 95,
  student_attendance_pct INT DEFAULT 88,
  lo_compliance_score   INT DEFAULT 80,            -- 0 to 100
  key_observations      TEXT,
  action_items          TEXT,
  status                TEXT NOT NULL DEFAULT 'COMPLETED'
                        CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP_REQUIRED')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_cluster_visits_cac ON sd_cluster_visits (cac_user_id);
CREATE INDEX IF NOT EXISTS idx_sd_cluster_visits_school ON sd_cluster_visits (school_udise);
CREATE INDEX IF NOT EXISTS idx_sd_cluster_visits_date ON sd_cluster_visits (visit_date DESC);
