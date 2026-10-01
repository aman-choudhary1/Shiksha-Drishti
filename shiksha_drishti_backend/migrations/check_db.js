require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });

async function check() {
  const r = await Promise.all([
    pool.query('SELECT COUNT(*) FROM sd_schools'),
    pool.query('SELECT COUNT(*) FROM sd_students'),
    pool.query('SELECT COUNT(*) FROM sd_assessments'),
    pool.query('SELECT COUNT(*) FROM sd_subject_marks'),
    pool.query('SELECT COUNT(*) FROM sd_question_marks'),
    pool.query("SELECT COUNT(*) FROM sd_users WHERE role = 'TEACHER'"),
    pool.query('SELECT DISTINCT district_cd, district_name FROM sd_schools ORDER BY district_name'),
    pool.query('SELECT COUNT(*) FROM sd_subjects'),
    pool.query('SELECT id, class_name FROM sd_classes ORDER BY class_num'),
    pool.query('SELECT id, name, code FROM sd_subjects'),
    pool.query('SELECT id, question_number, max_marks FROM sd_questions ORDER BY id LIMIT 5'),
    pool.query('SELECT udise_code, school_name, block_cd, block_name, district_cd FROM sd_schools LIMIT 5'),
  ]);
  console.log('Schools:', r[0].rows[0].count);
  console.log('Students:', r[1].rows[0].count);
  console.log('Assessments:', r[2].rows[0].count);
  console.log('SubjectMarks:', r[3].rows[0].count);
  console.log('QuestionMarks:', r[4].rows[0].count);
  console.log('Teachers:', r[5].rows[0].count);
  console.log('Districts:', JSON.stringify(r[6].rows));
  console.log('Subjects count:', r[7].rows[0].count);
  console.log('Subjects:', JSON.stringify(r[9].rows));
  console.log('Classes:', JSON.stringify(r[8].rows));
  console.log('Sample Questions:', JSON.stringify(r[10].rows));
  console.log('Sample Schools:', JSON.stringify(r[11].rows));
  await pool.end();
}
check().catch(e => { console.error('ERR:', e.message); process.exit(1); });
