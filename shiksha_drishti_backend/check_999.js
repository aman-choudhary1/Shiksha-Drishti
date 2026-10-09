const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12345',
  database: 'student_data',
});

async function run() {
  const r = await pool.query(`
    SELECT
      classid,
      examresultpy,
      COUNT(*) as total_students,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as count_999,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND exammarkspy::numeric <= 100 THEN 1 END) as valid_marks_count,
      ROUND(AVG(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND exammarkspy::numeric <= 100 THEN exammarkspy::numeric END), 2) as true_avg_marks
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY classid, examresultpy
    ORDER BY classid, examresultpy
    LIMIT 30
  `);
  console.log('Class & result breakdown:', r.rows);
  await pool.end();
}

run().catch(console.error);
