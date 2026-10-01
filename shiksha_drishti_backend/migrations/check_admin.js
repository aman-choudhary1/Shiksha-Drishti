require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });
async function check() {
  const r = await pool.query("SELECT username, full_name, role, scope_type, scope_value FROM sd_users WHERE username = 'admin'");
  console.log('Admin user:', JSON.stringify(r.rows[0], null, 2));
  await pool.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
