-- ==========================================================================
-- 003_students.sql
-- Student master — one row per student per class per academic year.
-- Roll number is the teacher-facing identifier.
-- ==========================================================================

\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS sd_students (
  id                BIGSERIAL PRIMARY KEY,
  school_udise      BIGINT NOT NULL REFERENCES sd_schools(udise_code),
  class_id          BIGINT NOT NULL REFERENCES sd_classes(id),
  academic_year_id  BIGINT NOT NULL REFERENCES sd_academic_years(id),
  roll_number       INT NOT NULL,
  student_name      TEXT NOT NULL,
  gender            TEXT CHECK (gender IN ('M','F','O')),
  dob               DATE,
  guardian_name     TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_udise, class_id, academic_year_id, roll_number)
);

CREATE INDEX IF NOT EXISTS idx_sd_students_school_class ON sd_students (school_udise, class_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_sd_students_roll ON sd_students (school_udise, class_id, academic_year_id, roll_number);
