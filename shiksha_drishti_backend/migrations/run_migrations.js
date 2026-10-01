#!/usr/bin/env node
/**
 * run_migrations.js
 * Applies all SQL migration files in order to the shiksha_drishti database.
 * Safe to re-run — uses IF NOT EXISTS throughout.
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const MIGRATIONS_DIR = __dirname;

async function run() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n🎓 SHIKSHA DRISHTI — Running ${files.length} migration(s)...\n`);

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8')
      .replace(/\\set ON_ERROR_STOP on/g, '')
      .replace(/\\ir .*/g, '');

    console.log(`  ➤ Applying: ${file}`);
    try {
      await pool.query(sql);
      console.log(`    ✅ Done`);
    } catch (err) {
      console.error(`    ❌ Error in ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations applied successfully.\n');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
