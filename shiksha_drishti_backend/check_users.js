require('dotenv').config();
const pool = require('./src/config/db');

async function check() {
  const r = await pool.query('SELECT username, role, full_name FROM sd_users LIMIT 5');
  console.log('Users in sd_users:', r.rows);
  await pool.end();
}

check().catch(console.error);
