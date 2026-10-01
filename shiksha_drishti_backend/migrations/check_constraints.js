require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });
async function check() {
  const r = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'sd_assessments'::regclass AND contype = 'c'
  `);
  r.rows.forEach(c => console.log(c.conname, ':', c.def));
  // Also check existing assessment types
  const r2 = await pool.query('SELECT DISTINCT assessment_type FROM sd_assessments');
  console.log('Existing types:', r2.rows.map(r => r.assessment_type));
  const r3 = await pool.query('SELECT DISTINCT status FROM sd_assessments');
  console.log('Existing statuses:', r3.rows.map(r => r.status));
  await pool.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
