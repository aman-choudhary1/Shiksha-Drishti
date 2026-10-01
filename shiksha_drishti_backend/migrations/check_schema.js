require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });

async function check() {
  // Check table schemas
  const tables = ['sd_teacher_assignments', 'sd_students', 'sd_assessments', 'sd_subject_marks', 'sd_question_marks', 'sd_schools', 'sd_users'];
  for (const t of tables) {
    const r = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
    console.log(`\n=== ${t} ===`);
    r.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`));
  }
  await pool.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
