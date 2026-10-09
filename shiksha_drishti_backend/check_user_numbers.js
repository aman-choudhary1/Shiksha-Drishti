require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function findNumbers() {
  console.log('--- Checking Govt Schools + Primary (Class 1-8) ---');
  const r1 = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
      COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
      COALESCE(SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END), 0) AS compartment,
      COALESCE(SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END), 0) AS absent
    FROM student_analytics_summary
    WHERE sch_mgmt_id = 1 AND classid::int BETWEEN 1 AND 8;
  `);
  console.log('Govt + Primary (1-8):', r1.rows[0]);

  console.log('--- Checking All Schools + Primary (Class 1-8) ---');
  const r2 = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
      COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
      COALESCE(SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END), 0) AS compartment,
      COALESCE(SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END), 0) AS absent
    FROM student_analytics_summary
    WHERE classid::int BETWEEN 1 AND 8;
  `);
  console.log('All + Primary (1-8):', r2.rows[0]);

  console.log('--- Checking Govt Schools Overall (All classes) ---');
  const r3 = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
      COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
      COALESCE(SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END), 0) AS compartment,
      COALESCE(SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END), 0) AS absent
    FROM student_analytics_summary
    WHERE sch_mgmt_id = 1;
  `);
  console.log('Govt Overall:', r3.rows[0]);

  console.log('--- Checking All Schools Overall (All classes) ---');
  const r4 = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
      COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
      COALESCE(SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END), 0) AS compartment,
      COALESCE(SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END), 0) AS absent
    FROM student_analytics_summary;
  `);
  console.log('All Overall:', r4.rows[0]);

  await pool.end();
}

findNumbers().catch(console.error);
