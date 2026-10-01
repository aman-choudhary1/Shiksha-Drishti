require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });

async function addIndexes() {
  console.log('Adding performance indexes...');
  const indexes = [
    // sd_subject_marks - most critical
    `CREATE INDEX IF NOT EXISTS idx_sm_assessment_id ON sd_subject_marks(assessment_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sm_student_id ON sd_subject_marks(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sm_subject_id ON sd_subject_marks(subject_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sm_marks_absent ON sd_subject_marks(marks_obtained, is_absent)`,
    `CREATE INDEX IF NOT EXISTS idx_sm_assess_marks ON sd_subject_marks(assessment_id, marks_obtained, is_absent, max_marks)`,

    // sd_assessments
    `CREATE INDEX IF NOT EXISTS idx_assess_school ON sd_assessments(school_udise)`,
    `CREATE INDEX IF NOT EXISTS idx_assess_status ON sd_assessments(status)`,
    `CREATE INDEX IF NOT EXISTS idx_assess_class ON sd_assessments(class_id)`,
    `CREATE INDEX IF NOT EXISTS idx_assess_created_by ON sd_assessments(created_by)`,

    // sd_schools
    `CREATE INDEX IF NOT EXISTS idx_schools_district ON sd_schools(district_cd)`,
    `CREATE INDEX IF NOT EXISTS idx_schools_block ON sd_schools(block_cd)`,
    `CREATE INDEX IF NOT EXISTS idx_schools_cluster ON sd_schools(cluster_cd)`,

    // sd_students
    `CREATE INDEX IF NOT EXISTS idx_students_school ON sd_students(school_udise)`,
    `CREATE INDEX IF NOT EXISTS idx_students_active ON sd_students(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_students_class ON sd_students(class_id)`,

    // sd_question_marks
    `CREATE INDEX IF NOT EXISTS idx_qm_assessment ON sd_question_marks(assessment_id)`,
    `CREATE INDEX IF NOT EXISTS idx_qm_student ON sd_question_marks(student_id)`,
    `CREATE INDEX IF NOT EXISTS idx_qm_question ON sd_question_marks(question_id)`,
    `CREATE INDEX IF NOT EXISTS idx_qm_subject ON sd_question_marks(subject_id)`,

    // sd_teacher_assignments
    `CREATE INDEX IF NOT EXISTS idx_ta_user ON sd_teacher_assignments(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ta_school ON sd_teacher_assignments(school_udise)`,
    `CREATE INDEX IF NOT EXISTS idx_ta_active ON sd_teacher_assignments(is_active)`,

    // sd_users
    `CREATE INDEX IF NOT EXISTS idx_users_role ON sd_users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_users_primary_udise ON sd_users(primary_udise)`,
    `CREATE INDEX IF NOT EXISTS idx_users_active ON sd_users(is_active)`,
  ];

  for (const sql of indexes) {
    const name = sql.match(/idx_\w+/)?.[0] || '?';
    process.stdout.write(`  Creating ${name}...`);
    await pool.query(sql);
    console.log(' ✓');
  }

  // Run ANALYZE to update planner statistics
  console.log('\nRunning ANALYZE...');
  await pool.query('ANALYZE sd_subject_marks, sd_assessments, sd_schools, sd_students, sd_question_marks, sd_users, sd_teacher_assignments');
  console.log('✓ ANALYZE done');

  console.log('\n✅ All indexes created!');
  await pool.end();
}

addIndexes().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
