require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function inspectExamResults() {
  console.log('=== 1. All distinct examresultpy values in student_data (studentstatus = 1) ===');
  const r1 = await pool.query(`
    SELECT
      examresultpy,
      COUNT(*) as student_count,
      ROUND(COUNT(*)::numeric / 5758713 * 100, 2) as pct_of_all_5_75m
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY examresultpy
    ORDER BY student_count DESC;
  `);
  console.table(r1.rows);

  console.log('\n=== 2. Breakdown for Govt Schools (sch_mgmt_id = 1) ===');
  const r2 = await pool.query(`
    SELECT
      sd.examresultpy,
      COUNT(*) as student_count,
      ROUND(COUNT(*)::numeric / 3697433 * 100, 2) as pct_of_govt
    FROM student_data sd
    LEFT JOIN mst_schools m ON m.udise_code = sd.udiseschcode
    WHERE sd.studentstatus = '1' AND COALESCE(m.sch_mgmt_id, 1) = 1
    GROUP BY sd.examresultpy
    ORDER BY student_count DESC;
  `);
  console.table(r2.rows);

  console.log('\n=== 3. Breakdown by classid and examresultpy ===');
  const r3 = await pool.query(`
    SELECT
      classid,
      COUNT(*) as total,
      COUNT(CASE WHEN examresultpy = '1' THEN 1 END) as pass_1,
      COUNT(CASE WHEN examresultpy = '0' THEN 1 END) as fail_0,
      COUNT(CASE WHEN examresultpy = '3' THEN 1 END) as comp_3,
      COUNT(CASE WHEN examresultpy = '4' THEN 1 END) as absent_4,
      COUNT(CASE WHEN examresultpy = '5' THEN 1 END) as not_appeared_5,
      COUNT(CASE WHEN examresultpy = '6' THEN 1 END) as code_6,
      COUNT(CASE WHEN examresultpy IS NULL OR examresultpy = 'null' OR examresultpy = '' THEN 1 END) as null_result
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY classid
    ORDER BY classid::numeric;
  `);
  console.table(r3.rows);

  console.log('\n=== 4. Check other related exam/attendance columns ===');
  const r4 = await pool.query(`
    SELECT
      examappearedprevyearyn,
      examresultpy,
      COUNT(*) as cnt
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY examappearedprevyearyn, examresultpy
    ORDER BY cnt DESC
    LIMIT 20;
  `);
  console.table(r4.rows);

  await pool.end();
}

inspectExamResults().catch(console.error);
