-- ==========================================================================
-- 005_marks.sql
-- The two core marks tables — foundation for all future analytics.
--
-- sd_subject_marks: MODE A — Class Report Card (Student × Subject)
-- sd_question_marks: MODE B — Question-wise (Student × Subject × Question)
--
-- CRITICAL: sd_question_marks.lo_id is the key column for future
-- Learning Outcome analytics at state scale.
-- ==========================================================================

\set ON_ERROR_STOP on

-- --------------------------------------------------------------------------
-- sd_subject_marks: CLASS REPORT CARD level marks
-- One row per (assessment, student, subject)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_subject_marks (
  id              BIGSERIAL PRIMARY KEY,
  assessment_id   BIGINT NOT NULL REFERENCES sd_assessments(id) ON DELETE CASCADE,
  student_id      BIGINT NOT NULL REFERENCES sd_students(id),
  subject_id      BIGINT NOT NULL REFERENCES sd_subjects(id),
  marks_obtained  NUMERIC(6,2),          -- NULL = not yet entered
  max_marks       INT NOT NULL DEFAULT 100,
  is_absent       BOOLEAN NOT NULL DEFAULT false,
  data_source     TEXT NOT NULL DEFAULT 'MANUAL'
                  CHECK (data_source IN ('MANUAL','DERIVED_FROM_QUESTIONS')),
                  -- DERIVED_FROM_QUESTIONS = auto-calculated from sd_question_marks
  created_by      BIGINT REFERENCES sd_users(id),
  updated_by      BIGINT REFERENCES sd_users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_subject_marks_assessment ON sd_subject_marks (assessment_id);
CREATE INDEX IF NOT EXISTS idx_sd_subject_marks_student    ON sd_subject_marks (student_id);

-- --------------------------------------------------------------------------
-- sd_question_marks: QUESTION-WISE level marks
-- One row per (assessment, student, question)
-- This is the ANALYTICS FOUNDATION — lo_id links every mark to a
-- Learning Outcome, enabling LO-level analysis at state scale.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sd_question_marks (
  id              BIGSERIAL PRIMARY KEY,
  assessment_id   BIGINT NOT NULL REFERENCES sd_assessments(id) ON DELETE CASCADE,
  student_id      BIGINT NOT NULL REFERENCES sd_students(id),
  subject_id      BIGINT NOT NULL REFERENCES sd_subjects(id),
  question_id     BIGINT NOT NULL REFERENCES sd_questions(id),
  lo_id           BIGINT REFERENCES sd_learning_outcomes(id),
  marks_obtained  NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_marks       INT NOT NULL DEFAULT 10,
  is_absent       BOOLEAN NOT NULL DEFAULT false,
  created_by      BIGINT REFERENCES sd_users(id),
  updated_by      BIGINT REFERENCES sd_users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_sd_question_marks_assessment ON sd_question_marks (assessment_id);
CREATE INDEX IF NOT EXISTS idx_sd_question_marks_student    ON sd_question_marks (student_id);
CREATE INDEX IF NOT EXISTS idx_sd_question_marks_question   ON sd_question_marks (question_id);
CREATE INDEX IF NOT EXISTS idx_sd_question_marks_lo         ON sd_question_marks (lo_id);
-- Composite index for future analytics queries: LO performance per assessment
CREATE INDEX IF NOT EXISTS idx_sd_question_marks_lo_asmt    ON sd_question_marks (lo_id, assessment_id);

-- --------------------------------------------------------------------------
-- CONSTRAINT: marks_obtained cannot exceed max_marks in question_marks
-- --------------------------------------------------------------------------
ALTER TABLE sd_question_marks
  ADD CONSTRAINT chk_qmarks_range
  CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks);

ALTER TABLE sd_subject_marks
  ADD CONSTRAINT chk_smarks_range
  CHECK (marks_obtained IS NULL OR (marks_obtained >= 0 AND marks_obtained <= max_marks));

-- --------------------------------------------------------------------------
-- sd_assessment_status_view: Convenience view for dashboard status cards
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_sd_assessment_status AS
SELECT
  a.id AS assessment_id,
  a.school_udise,
  a.class_id,
  a.academic_year_id,
  a.assessment_name,
  a.status,
  a.created_by,
  COUNT(DISTINCT sm.student_id) AS students_with_subject_marks,
  COUNT(DISTINCT qm.student_id) AS students_with_question_marks,
  COUNT(DISTINCT s.id)          AS total_students
FROM sd_assessments a
LEFT JOIN sd_students s
  ON s.school_udise = a.school_udise
  AND s.class_id = a.class_id
  AND s.academic_year_id = a.academic_year_id
  AND s.is_active = true
LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
LEFT JOIN sd_question_marks qm ON qm.assessment_id = a.id
GROUP BY a.id, a.school_udise, a.class_id, a.academic_year_id,
         a.assessment_name, a.status, a.created_by;
