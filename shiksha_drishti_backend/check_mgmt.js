require('dotenv').config();
const { Pool } = require('pg');

const mainPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME || 'shiksha_drishti',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const studentPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.STUDENT_DB_NAME || 'student_data',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function check() {
  try {
    // 1. Check mst_schools in mainPool
    const mainMst = await mainPool.query(`
      SELECT sch_mgmt_id, COUNT(*) as count 
      FROM mst_schools 
      GROUP BY sch_mgmt_id 
      ORDER BY count DESC
    `);
    console.log('mst_schools in shiksha_drishti DB - sch_mgmt_id distribution:', mainMst.rows);

    // 2. Check if mst_schools exists in student_data DB
    const studentDbTables = await studentPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in student_data DB:', studentDbTables.rows.map(r => r.table_name));

    // 3. Check student_data column names to see if sch_mgmt_id or similar is already in student_data
    const studentCols = await studentPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'student_data' AND column_name ILIKE '%mgmt%'
    `);
    console.log('Management columns in student_data table:', studentCols.rows);

  } catch (err) {
    console.error('Check error:', err);
  } finally {
    mainPool.end();
    studentPool.end();
  }
}

check();
