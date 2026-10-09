require('dotenv').config();
const pool = require('../src/config/db');

async function runAssessmentMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running Assessment Question Bank Migration...');
    await client.query('BEGIN');

    // 1. Assessment Papers Table
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
        academic_year VARCHAR(20) DEFAULT '2018-19',
        instructions_en TEXT,
        instructions_hi TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Questions Table
    await client.query(`
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
    `);

    // 3. Question Options Table
    await client.query(`
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
    `);

    // 4. Submissions Table (for Mobile App offline/online tests)
    await client.query(`
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
    `);

    // Create helpful indices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sd_questions_paper ON sd_mobile_questions(paper_id);
      CREATE INDEX IF NOT EXISTS idx_sd_options_question ON sd_mobile_question_options(question_id);
      CREATE INDEX IF NOT EXISTS idx_sd_submissions_paper ON sd_student_assessment_submissions(paper_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Assessment Question Bank tables created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}

runAssessmentMigration().then(() => process.exit(0)).catch(() => process.exit(1));
