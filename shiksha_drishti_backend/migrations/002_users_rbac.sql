-- ==========================================================================
-- 002_users_rbac.sql
-- Users (teachers, admins) and Role-Based Access Control.
-- Roles designed for all future levels: TEACHER → STATE_ADMIN
-- ==========================================================================

\set ON_ERROR_STOP on

-- --------------------------------------------------------------------------
-- sd_users: All platform users — teachers, block officers, state admins etc.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_users (
  id              BIGSERIAL PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT,
  mobile          TEXT,
  role            TEXT NOT NULL DEFAULT 'TEACHER'
                  CHECK (role IN (
                    'TEACHER',
                    'SCHOOL_ADMIN',
                    'BLOCK_OFFICER',
                    'DISTRICT_OFFICER',
                    'STATE_ADMIN',
                    'DATA_ANALYST',
                    'SUPER_ADMIN'
                  )),
  primary_udise   BIGINT REFERENCES sd_schools(udise_code) ON DELETE SET NULL,
  scope_type      TEXT NOT NULL DEFAULT 'school'
                  CHECK (scope_type IN ('school','block','district','state')),
  scope_value     TEXT,   -- block_cd, district_cd, or NULL for state
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_users_username ON sd_users (username);
CREATE INDEX IF NOT EXISTS idx_sd_users_role     ON sd_users (role);
CREATE INDEX IF NOT EXISTS idx_sd_users_udise    ON sd_users (primary_udise);

-- --------------------------------------------------------------------------
-- sd_teacher_assignments: Maps a teacher to specific school+class+year
-- A teacher may be assigned to multiple classes/schools
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_teacher_assignments (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES sd_users(id) ON DELETE CASCADE,
  school_udise      BIGINT NOT NULL REFERENCES sd_schools(udise_code),
  class_id          BIGINT NOT NULL REFERENCES sd_classes(id),
  academic_year_id  BIGINT NOT NULL REFERENCES sd_academic_years(id),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_udise, class_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_assignments_user  ON sd_teacher_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_sd_assignments_school ON sd_teacher_assignments (school_udise, academic_year_id);
