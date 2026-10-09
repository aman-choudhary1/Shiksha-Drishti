require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function verifyFailData() {
  console.log('=== 1. Detailed breakdown of ALL 555,595 students with examresultpy = 0 ===');
  const r1 = await pool.query(`
    SELECT
      classid,
      COUNT(*) as total_fail_code_0,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as fail_with_999_marks,
      COUNT(CASE WHEN exammarkspy != '999.0' AND exammarkspy != '999' AND exammarkspy IS NOT NULL AND exammarkspy != 'null' THEN 1 END) as fail_with_real_marks,
      STRING_AGG(DISTINCT CASE WHEN exammarkspy != '999.0' AND exammarkspy != '999' AND exammarkspy IS NOT NULL THEN exammarkspy END, ', ') as sample_real_marks
    FROM student_data
    WHERE studentstatus = '1' AND examresultpy = '0'
    GROUP BY classid
    ORDER BY classid::numeric;
  `);
  console.table(r1.rows);

  console.log('\n=== 2. Why are students in Class 1 to 8 having examresultpy = 0 and exammarkspy = 999.0? ===');
  const r2 = await pool.query(`
    SELECT
      classid,
      examresultpy,
      exammarkspy,
      COUNT(*) as count
    FROM student_data
    WHERE studentstatus = '1' AND classid IN ('1', '2', '3', '9', '10')
    GROUP BY classid, examresultpy, exammarkspy
    ORDER BY classid::numeric, count DESC
    LIMIT 25;
  `);
  console.table(r2.rows);

  console.log('\n=== 3. What about students with marks < 33 (e.g. failing marks 0-32%)? ===');
  const r3 = await pool.query(`
    SELECT
      examresultpy,
      COUNT(*) as total_students_with_marks_below_33,
      ROUND(AVG(exammarkspy::numeric), 2) as avg_marks
    FROM student_data
    WHERE studentstatus = '1'
      AND exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$'
      AND exammarkspy::numeric < 33
    GROUP BY examresultpy;
  `);
  console.table(r3.rows);

  console.log('\n=== 4. Class 9 to 12 (Board / Secondary) examination results ===');
  const r4 = await pool.query(`
    SELECT
      classid,
      COUNT(*) as total_students,
      COUNT(CASE WHEN examresultpy = '1' THEN 1 END) as pass_1,
      COUNT(CASE WHEN examresultpy = '0' THEN 1 END) as fail_0,
      COUNT(CASE WHEN examresultpy = '3' THEN 1 END) as comp_3,
      COUNT(CASE WHEN examresultpy IN ('4','5') THEN 1 END) as absent_4_5,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as total_999_in_class
    FROM student_data
    WHERE studentstatus = '1' AND classid::numeric >= 9
    GROUP BY classid
    ORDER BY classid::numeric;
  `);
  console.table(r4.rows);

  await pool.end();
}

verifyFailData().catch(console.error);
