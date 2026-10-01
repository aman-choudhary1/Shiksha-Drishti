-- ==========================================================================
-- 001_master_tables.sql
-- Core master/reference tables: schools, academic years, classes,
-- subjects, learning outcomes, question bank.
-- All Shiksha Drishti tables are prefixed with "sd_" to avoid collisions.
-- ==========================================================================

\set ON_ERROR_STOP on

-- --------------------------------------------------------------------------
-- sd_schools: Mirror of mst_schools from the attendance DB.
-- Populated by seed_from_attendance.js migration script.
-- UDISE code is the universal school identity throughout the system.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_schools (
  udise_code        BIGINT PRIMARY KEY,
  school_name       TEXT NOT NULL,
  cluster_cd        TEXT NOT NULL,
  cluster_name      TEXT NOT NULL,
  block_cd          TEXT NOT NULL,
  block_name        TEXT NOT NULL,
  district_cd       TEXT NOT NULL,
  district_name     TEXT NOT NULL,
  state_cd          TEXT NOT NULL DEFAULT 'CG',
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  school_type       TEXT,          -- Government / Aided / Private
  school_management TEXT,
  hos_name          TEXT,          -- Head of School name
  hos_mobile        TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_schools_district ON sd_schools (district_cd);
CREATE INDEX IF NOT EXISTS idx_sd_schools_block    ON sd_schools (block_cd);
CREATE INDEX IF NOT EXISTS idx_sd_schools_cluster  ON sd_schools (cluster_cd);

-- --------------------------------------------------------------------------
-- sd_academic_years: e.g. "2026-27"
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_academic_years (
  id          BIGSERIAL PRIMARY KEY,
  year_label  TEXT NOT NULL UNIQUE,   -- "2026-27"
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- sd_classes: Class 1 through Class 12
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_classes (
  id          BIGSERIAL PRIMARY KEY,
  class_name  TEXT NOT NULL UNIQUE,   -- "Class 6"
  class_num   INT NOT NULL UNIQUE,    -- 6
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- --------------------------------------------------------------------------
-- sd_subjects: Subject master — configurable per school/class in future
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_subjects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,   -- "HINDI", "MATH", "ENG", "SCI", "SST"
  default_max_marks INT NOT NULL DEFAULT 100,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- sd_learning_outcomes: LO master — e.g. LO-MATH-06-01
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_learning_outcomes (
  id          BIGSERIAL PRIMARY KEY,
  lo_code     TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  class_id    BIGINT REFERENCES sd_classes(id) ON DELETE SET NULL,
  subject_id  BIGINT REFERENCES sd_subjects(id) ON DELETE SET NULL,
  competency  TEXT,   -- future: skill/competency grouping
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sd_lo_class_subject ON sd_learning_outcomes (class_id, subject_id);

-- --------------------------------------------------------------------------
-- sd_questions: Question bank — one row per unique question
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_questions (
  id              BIGSERIAL PRIMARY KEY,
  academic_year_id BIGINT REFERENCES sd_academic_years(id) ON DELETE SET NULL,
  class_id        BIGINT NOT NULL REFERENCES sd_classes(id),
  subject_id      BIGINT NOT NULL REFERENCES sd_subjects(id),
  question_number TEXT NOT NULL,        -- "Q01", "Q02" ...
  question_text   TEXT,                 -- optional in Phase 1
  max_marks       INT NOT NULL DEFAULT 10,
  lo_id           BIGINT REFERENCES sd_learning_outcomes(id),
  question_type   TEXT NOT NULL DEFAULT 'WRITTEN',
  difficulty      TEXT,                 -- EASY / MEDIUM / HARD (future)
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, class_id, subject_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_sd_questions_class_subject ON sd_questions (class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_sd_questions_lo ON sd_questions (lo_id);
