require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });

async function fix() {
  console.log('Fixing district name inconsistencies...');
  // Standardize all district names to uppercase
  const r = await pool.query(`
    UPDATE sd_schools SET district_name = UPPER(district_name)
    WHERE district_name != UPPER(district_name)
  `);
  console.log(`Updated ${r.rowCount} rows`);

  // Verify
  const v = await pool.query('SELECT DISTINCT district_cd, district_name, COUNT(*) as schools FROM sd_schools GROUP BY district_cd, district_name ORDER BY district_cd');
  console.log('Districts now:');
  v.rows.forEach(r => console.log(`  ${r.district_cd} | ${r.district_name} | ${r.schools} schools`));

  await pool.end();
}
fix().catch(e => { console.error(e.message); process.exit(1); });
