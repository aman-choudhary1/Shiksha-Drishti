-- ==========================================================================
-- 004_assessments.sql
-- Assessment (exam/test) lifecycle: DRAFT → SUBMITTED → VERIFIED → LOCKED
-- sd_assessment_subjects: which subjects + max_marks per assessment
-- sd_assessment_submissions: tracks submission status per assessment
-- ==========================================================================

\set ON_ERROR_STOP on

-- --------------------------------------------------------------------------
-- sd_assessments: One row per examination event
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_assessments (
  id                BIGSERIAL PRIMARY KEY,
  academic_year_id  BIGINT NOT NULL REFERENCES sd_academic_years(id),
  school_udise      BIGINT NOT NULL REFERENCES sd_schools(udise_code),
  class_id          BIGINT NOT NULL REFERENCES sd_classes(id),
  assessment_name   TEXT NOT NULL,
  assessment_type   TEXT NOT NULL DEFAULT 'TERM'
                    CHECK (assessment_type IN ('TERM','UNIT','FINAL','CUSTOM','MONTHLY')),
  status            TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','SUBMITTED','VERIFIED','LOCKED','REOPENED')),
  total_students    INT,           -- cached count at submission time
  students_entered  INT,           -- cached count at submission time
  created_by        BIGINT NOT NULL REFERENCES sd_users(id),
  submitted_at      TIMESTAMPTZ,
  submitted_by      BIGINT REFERENCES sd_users(id),
  verified_at       TIMESTAMPTZ,
  verified_by       BIGINT REFERENCES sd_users(id),
  locked_at         TIMESTAMPTZ,
  locked_by         BIGINT REFERENCES sd_users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, school_udise, class_id, assessment_name)
);

CREATE INDEX IF NOT EXISTS idx_sd_assessments_school ON sd_assessments (school_udise, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_sd_assessments_class  ON sd_assessments (class_id);
CREATE INDEX IF NOT EXISTS idx_sd_assessments_status ON sd_assessments (status);

-- --------------------------------------------------------------------------
-- sd_assessment_subjects: Which subjects + max marks are in an assessment
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_assessment_subjects (
  id              BIGSERIAL PRIMARY KEY,
  assessment_id   BIGINT NOT NULL REFERENCES sd_assessments(id) ON DELETE CASCADE,
  subject_id      BIGINT NOT NULL REFERENCES sd_subjects(id),
  max_marks       INT NOT NULL DEFAULT 100,
  sort_order      INT NOT NULL DEFAULT 0,
  UNIQUE (assessment_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_asmt_subjects_asmt ON sd_assessment_subjects (assessment_id);
