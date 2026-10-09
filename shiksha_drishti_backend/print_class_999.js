require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function run() {
  const r2 = await pool.query(`
    SELECT
      classid,
      CASE classid
        WHEN '-3' THEN 'Nursery / Balvatika 1'
        WHEN '-2' THEN 'LKG / Balvatika 2'
        WHEN '-1' THEN 'UKG / Balvatika 3'
        WHEN '0' THEN 'KG'
        ELSE 'Class ' || classid
      END as class_name,
      COUNT(*) as total_students,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as count_999,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_of_class,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / 555348 * 100, 2) as share_of_all_999,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric <= 100 THEN 1 END) as valid_marks_count
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY classid
    ORDER BY classid::numeric;
  `);
  console.log(JSON.stringify(r2.rows, null, 2));
  await pool.end();
}

run().catch(console.error);
