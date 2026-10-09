require('dotenv').config();
const pool = require('../src/config/db');

async function enhanceSchema() {
  const client = await pool.connect();
  try {
    console.log('🚀 Enhancing assessment question schema for mobile format...');
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE sd_mobile_questions 
      ADD COLUMN IF NOT EXISTS hint TEXT,
      ADD COLUMN IF NOT EXISTS images_json JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS answer_text TEXT;

      ALTER TABLE sd_mobile_question_options
      ADD COLUMN IF NOT EXISTS option_image TEXT;
    `);

    await client.query('COMMIT');
    console.log('✅ Schema enhanced successfully for mobile JSON format!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Schema enhancement error:', err);
    throw err;
  } finally {
    client.release();
  }
}

enhanceSchema().then(() => process.exit(0)).catch(() => process.exit(1));
