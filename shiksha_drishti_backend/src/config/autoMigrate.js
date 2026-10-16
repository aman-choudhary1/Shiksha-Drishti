/**
 * autoMigrate.js
 * Automatically verifies and initializes database schema and mock assessment data
 * on server startup. Ensures that when the backend runs on ANY computer,
 * all tables, dummy students, classes, and test papers are ready immediately.
 */
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function autoMigrate() {
  const client = await pool.connect();
  try {
    // 1. Ensure Assessment Tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS sd_assessment_papers (
        id SERIAL PRIMARY KEY,
        paper_code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        title_hi VARCHAR(255),
        class_no INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        total_questions INT DEFAULT 15,
        total_marks INT DEFAULT 15,
        duration_minutes INT DEFAULT 45,
        academic_year VARCHAR(20) DEFAULT '2026-27',
        instructions_en TEXT,
        instructions_hi TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sd_mobile_questions (
        id SERIAL PRIMARY KEY,
        paper_id INT NOT NULL REFERENCES sd_assessment_papers(id) ON DELETE CASCADE,
        question_number INT NOT NULL,
        question_text_en TEXT NOT NULL,
        question_text_hi TEXT,
        question_image_url TEXT,
        lo_code VARCHAR(50),
        lo_description TEXT,
        question_type VARCHAR(20) DEFAULT 'MCQ',
        marks NUMERIC(4,2) DEFAULT 1.0,
        explanation_en TEXT,
        explanation_hi TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_paper_question UNIQUE(paper_id, question_number)
      );

      CREATE TABLE IF NOT EXISTS sd_mobile_question_options (
        id SERIAL PRIMARY KEY,
        question_id INT NOT NULL REFERENCES sd_mobile_questions(id) ON DELETE CASCADE,
        option_key VARCHAR(10) NOT NULL,
        option_text_en TEXT,
        option_text_hi TEXT,
        option_image_url TEXT,
        is_correct BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_question_option UNIQUE(question_id, option_key)
      );

      CREATE TABLE IF NOT EXISTS sd_student_assessment_submissions (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50),
        student_name VARCHAR(100),
        paper_id INT NOT NULL REFERENCES sd_assessment_papers(id) ON DELETE CASCADE,
        school_id INT,
        class_no INT,
        total_score NUMERIC(5,2) DEFAULT 0.0,
        max_marks NUMERIC(5,2) DEFAULT 15.0,
        percentage NUMERIC(5,2) DEFAULT 0.0,
        answers_json JSONB,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sd_questions_paper ON sd_mobile_questions(paper_id);
      CREATE INDEX IF NOT EXISTS idx_sd_options_question ON sd_mobile_question_options(question_id);
      CREATE INDEX IF NOT EXISTS idx_sd_submissions_paper ON sd_student_assessment_submissions(paper_id);
    `);

    // 2. Ensure Base Tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS sd_schools (
        udise_code BIGINT PRIMARY KEY,
        school_name TEXT NOT NULL,
        cluster_cd TEXT,
        cluster_name TEXT,
        block_cd TEXT,
        block_name TEXT,
        district_cd TEXT,
        district_name TEXT,
        state_cd TEXT DEFAULT 'CG',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        school_type TEXT,
        school_management TEXT,
        hos_name TEXT,
        hos_mobile TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sd_academic_years (
        id BIGSERIAL PRIMARY KEY,
        year_label TEXT NOT NULL UNIQUE,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sd_classes (
        id BIGSERIAL PRIMARY KEY,
        class_name TEXT NOT NULL UNIQUE,
        class_num INT NOT NULL UNIQUE,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS sd_students (
        id BIGSERIAL PRIMARY KEY,
        student_name VARCHAR(150) NOT NULL,
        school_udise BIGINT REFERENCES sd_schools(udise_code),
        class_id INT,
        academic_year_id INT,
        roll_number INT,
        gender VARCHAR(10),
        dob DATE,
        guardian_name VARCHAR(150),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT uq_student_school_class_roll UNIQUE(school_udise, class_id, academic_year_id, roll_number)
      );

      CREATE TABLE IF NOT EXISTS sd_users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150),
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'TEACHER',
        primary_udise BIGINT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS sd_teacher_assignments (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES sd_users(id) ON DELETE CASCADE,
        school_udise BIGINT REFERENCES sd_schools(udise_code),
        class_id BIGINT REFERENCES sd_classes(id),
        academic_year_id BIGINT REFERENCES sd_academic_years(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        CONSTRAINT uq_teacher_assignment UNIQUE(user_id, school_udise, class_id, academic_year_id)
      );
    `);

    // 3. Ensure Academic Years & Classes
    await client.query(`
      INSERT INTO sd_academic_years (id, year_label, start_date, end_date, is_active)
      VALUES (3, '2026-27', '2026-04-01', '2027-03-31', true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO sd_classes (id, class_name, class_num, is_active)
      VALUES
        (1, 'Class 1', 1, true),
        (2, 'Class 2', 2, true),
        (3, 'Class 3', 3, true),
        (4, 'Class 4', 4, true),
        (5, 'Class 5', 5, true),
        (6, 'Class 6', 6, true),
        (7, 'Class 7', 7, true),
        (8, 'Class 8', 8, true),
        (9, 'Class 9', 9, true),
        (10, 'Class 10', 10, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. Ensure Default Demo School exists
    await client.query(`
      INSERT INTO sd_schools (
        udise_code, school_name, cluster_cd, cluster_name,
        block_cd, block_name, district_cd, district_name,
        latitude, longitude, is_active
      ) VALUES (
        22050904705,
        'SWAMI ATMANAND UTKRISHT HINDI MEDIUM SCHOOL CHHINDPUR',
        '220509001', 'CHHINDPUR',
        '220509', 'ABHANPUR',
        '2205', 'RAIPUR',
        21.0553, 81.7612, true
      ) ON CONFLICT (udise_code) DO NOTHING;
    `);

    // 5. Ensure Default Demo Teachers exist
    const defaultPassHash = await bcrypt.hash('Admin@123', 10);
    await client.query(`
      INSERT INTO sd_users (id, username, email, password_hash, full_name, role, primary_udise, is_active)
      VALUES 
        (2, 'teacher.raipur', 'teacher.raipur@shiksha.cg.gov.in', $1, 'Teacher Raipur', 'TEACHER', 22050904705, true),
        (3, 'teacher.ananya', 'teacher.ananya@shiksha.cg.gov.in', $1, 'Ananya Sharma', 'TEACHER', 22050904705, true)
      ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, primary_udise = EXCLUDED.primary_udise;
    `, [defaultPassHash]);

    // Ensure fast, accurate vw_sd_assessment_status view
    await client.query(`
      CREATE OR REPLACE VIEW vw_sd_assessment_status AS
      SELECT 
          a.id AS assessment_id,
          a.school_udise,
          a.class_id,
          a.academic_year_id,
          a.assessment_name,
          a.status,
          a.created_by,
          COALESCE((
            SELECT COUNT(DISTINCT sm.student_id) 
            FROM sd_subject_marks sm 
            WHERE sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
          ), 0) AS students_with_subject_marks,
          COALESCE((
            SELECT COUNT(DISTINCT qm.student_id) 
            FROM sd_question_marks qm 
            WHERE qm.assessment_id = a.id
          ), 0) AS students_with_question_marks,
          COALESCE(
            NULLIF((SELECT COUNT(*) FROM sd_students st 
                    WHERE st.school_udise = a.school_udise 
                      AND st.class_id = a.class_id 
                      AND st.academic_year_id = a.academic_year_id 
                      AND st.is_active = true), 0),
            (SELECT COUNT(*) FROM sd_students st 
             WHERE st.school_udise = a.school_udise 
               AND st.class_id = a.class_id 
               AND st.is_active = true)
          ) AS total_students
      FROM sd_assessments a;
    `);

    // Ensure teacher assignments for Classes 1 to 10
    for (const uId of [2, 3]) {
      for (let c = 1; c <= 10; c++) {
        await client.query(`
          INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id, is_active)
          VALUES ($1, 22050904705, $2, 3, true)
          ON CONFLICT (user_id, school_udise, class_id, academic_year_id) DO NOTHING;
        `, [uId, c]);
      }
    }

    // 6. Check if Mock Papers or Students are missing
    const paperCountRes = await client.query('SELECT COUNT(*) FROM sd_assessment_papers');
    const paperCount = parseInt(paperCountRes.rows[0].count, 10);

    const studentCountRes = await client.query(
      'SELECT COUNT(*) FROM sd_students WHERE school_udise = 22050904705 AND class_id = 1'
    );
    const studentCount = parseInt(studentCountRes.rows[0].count, 10);

    if (paperCount < 5 || studentCount === 0) {
      console.log('📦 [AutoMigrate] Missing dummy data detected. Auto-seeding mobile mock test data...');
      
      const seedMobileMockData = require('../../migrations/seed_mobile_mock_data');
      await seedMobileMockData();

      const seedMorePapers = require('../../migrations/seed_more_mock_papers');
      await seedMorePapers();
      
      console.log('✅ [AutoMigrate] Mobile mock dummy data successfully auto-seeded!');
    } else {
      console.log(`✨ [AutoMigrate] Database verified: ${paperCount} mock papers, ${studentCount} Class 1 students ready.`);
    }

  } catch (err) {
    console.error('⚠️ [AutoMigrate] Database auto-migration warning:', err.message);
  } finally {
    client.release();
  }
}

module.exports = autoMigrate;
