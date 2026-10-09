require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function inspectExclusion() {
  console.log('=== Comparing Total vs Excluded 999.0 records ===');
  const r = await pool.query(`
    SELECT
      COUNT(*) as total_active_students,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as count_999,
      COUNT(CASE WHEN exammarkspy != '999.0' AND exammarkspy != '999' AND exammarkspy IS NOT NULL AND exammarkspy != 'null' THEN 1 END) as students_excluding_999,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND exammarkspy::numeric BETWEEN 0 AND 100 THEN 1 END) as valid_scored_0_100
    FROM student_data
    WHERE studentstatus = '1';
  `);
  console.table(r.rows);

  console.log('=== Exam outcomes when excluding 999.0 ===');
  const r2 = await pool.query(`
    SELECT
      examresultpy,
      COUNT(*) as count_all,
      COUNT(CASE WHEN exammarkspy != '999.0' AND exammarkspy != '999' THEN 1 END) as count_excluding_999
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY examresultpy
    ORDER BY count_all DESC;
  `);
  console.table(r2.rows);

  console.log('=== Govt Schools (sch_mgmt_id = 1) when excluding 999.0 ===');
  const r3 = await pool.query(`
    SELECT
      sd.examresultpy,
      COUNT(*) as count_all,
      COUNT(CASE WHEN sd.exammarkspy != '999.0' AND sd.exammarkspy != '999' THEN 1 END) as count_excluding_999
    FROM student_data sd
    LEFT JOIN mst_schools m ON m.udise_code = sd.udiseschcode
    WHERE sd.studentstatus = '1' AND COALESCE(m.sch_mgmt_id, 1) = 1
    GROUP BY sd.examresultpy
    ORDER BY count_all DESC;
  `);
  console.table(r3.rows);

  console.log('=== Govt Schools Primary (1-8) when excluding 999.0 ===');
  const r4 = await pool.query(`
    SELECT
      sd.examresultpy,
      COUNT(*) as count_all,
      COUNT(CASE WHEN sd.exammarkspy != '999.0' AND sd.exammarkspy != '999' THEN 1 END) as count_excluding_999
    FROM student_data sd
    LEFT JOIN mst_schools m ON m.udise_code = sd.udiseschcode
    WHERE sd.studentstatus = '1' AND COALESCE(m.sch_mgmt_id, 1) = 1 AND sd.classid ~ '^[0-9]+$' AND sd.classid::int BETWEEN 1 AND 8
    GROUP BY sd.examresultpy
    ORDER BY count_all DESC;
  `);
  console.table(r4.rows);

  await pool.end();
}

inspectExclusion().catch(console.error);
