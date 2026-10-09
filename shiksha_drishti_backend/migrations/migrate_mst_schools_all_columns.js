#!/usr/bin/env node
/**
 * migrate_mst_schools_all_columns.js
 * 
 * Migrates mst_schools from attendance database (vsk_attadance)
 * to Shiksha Drishti database (shiksha_drishti) with ALL 91 columns.
 * 
 * Usage:
 *   node migrations/migrate_mst_schools_all_columns.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const targetPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
});

const sourcePool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.ATTENDANCE_DB_NAME || 'vsk_attadance',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
});

async function migrateMstSchools() {
  console.log('\n=============================================================');
  console.log('🏫 MIGRATING mst_schools (ALL COLUMNS) TO SHIKSHA DRISHTI');
  console.log('=============================================================\n');

  const startTime = Date.now();

  try {
    // 1. Fetch source column definitions
    console.log('1️⃣ Fetching schema definition of mst_schools from attendance database...');
    const colRes = await sourcePool.query(`
      SELECT 
        column_name, 
        data_type, 
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'mst_schools'
      ORDER BY ordinal_position;
    `);

    if (colRes.rows.length === 0) {
      throw new Error('mst_schools table not found in source database!');
    }

    console.log(`   Found ${colRes.rows.length} columns in source mst_schools table.`);

    // 2. Build DDL for target table
    const columnDefs = colRes.rows.map(col => {
      let typeDef = col.data_type;
      if (col.data_type === 'character varying' && col.character_maximum_length) {
        typeDef = `VARCHAR(${col.character_maximum_length})`;
      } else if (col.data_type === 'USER-DEFINED') {
        typeDef = col.udt_name;
      }
      
      const isPk = col.column_name === 'id' ? ' PRIMARY KEY' : '';
      return `"${col.column_name}" ${typeDef}${isPk}`;
    });

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS mst_schools (
        ${columnDefs.join(',\n        ')}
      );
    `;

    console.log('\n2️⃣ Creating mst_schools table in shiksha_drishti database with all 91 columns...');
    await targetPool.query(createTableSql);
    console.log('   ✅ Table mst_schools created / verified.');

    // 3. Check existing target count
    const targetCheck = await targetPool.query(`SELECT COUNT(*) FROM mst_schools`);
    const sourceCheck = await sourcePool.query(`SELECT COUNT(*) FROM mst_schools`);
    const sourceCount = parseInt(sourceCheck.rows[0].count, 10);
    const targetCount = parseInt(targetCheck.rows[0].count, 10);

    console.log(`\n3️⃣ Source count: ${sourceCount} rows | Target count: ${targetCount} rows`);

    if (targetCount === sourceCount && targetCount > 0) {
      console.log('   ℹ️ Target already has all records. Truncating to do a clean full migration...');
    }

    await targetPool.query(`TRUNCATE TABLE mst_schools;`);

    // 4. Migrate data in batches
    console.log('\n4️⃣ Migrating all 59,354 school records in batches of 1,000...');
    const columnNames = colRes.rows.map(c => `"${c.column_name}"`);
    const colListStr = columnNames.join(', ');

    const BATCH_SIZE = 200;
    let offset = 0;
    let insertedTotal = 0;

    while (offset < sourceCount) {
      const fetchQ = `
        SELECT * FROM mst_schools 
        ORDER BY id 
        LIMIT ${BATCH_SIZE} OFFSET ${offset}
      `;
      const batchRes = await sourcePool.query(fetchQ);
      if (batchRes.rows.length === 0) break;

      // Construct parameterized multi-row insert
      const rows = batchRes.rows;
      const values = [];
      const rowPlaceholders = [];

      rows.forEach((row, rIdx) => {
        const placeholders = [];
        colRes.rows.forEach((col, cIdx) => {
          values.push(row[col.column_name]);
          placeholders.push(`$${values.length}`);
        });
        rowPlaceholders.push(`(${placeholders.join(', ')})`);
      });

      const insertSql = `
        INSERT INTO mst_schools (${colListStr})
        VALUES ${rowPlaceholders.join(',\n')}
        ON CONFLICT (id) DO NOTHING;
      `;

      await targetPool.query(insertSql, values);
      insertedTotal += rows.length;
      offset += rows.length;

      const progress = Math.min(100, Math.round((offset / sourceCount) * 100));
      process.stdout.write(`\r   Progress: ${insertedTotal.toLocaleString()} / ${sourceCount.toLocaleString()} schools (${progress}%)`);
    }

    console.log('\n\n5️⃣ Creating performance indexes on mst_schools...');
    await targetPool.query(`CREATE INDEX IF NOT EXISTS idx_mst_schools_udise ON mst_schools (udise_code);`);
    await targetPool.query(`CREATE INDEX IF NOT EXISTS idx_mst_schools_district ON mst_schools (district_cd);`);
    await targetPool.query(`CREATE INDEX IF NOT EXISTS idx_mst_schools_block ON mst_schools (block_cd);`);
    await targetPool.query(`CREATE INDEX IF NOT EXISTS idx_mst_schools_cluster ON mst_schools (cluster_cd);`);
    await targetPool.query(`CREATE INDEX IF NOT EXISTS idx_mst_schools_name ON mst_schools (school_name);`);

    // 6. Verification
    const finalTargetCount = await targetPool.query(`SELECT COUNT(*) FROM mst_schools`);
    const finalCols = await targetPool.query(`
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'mst_schools'
    `);

    console.log('\n=============================================================');
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('=============================================================');
    console.log(`   Source Database : ${process.env.ATTENDANCE_DB_NAME || 'vsk_attadance'}`);
    console.log(`   Target Database : ${process.env.DB_NAME || 'shiksha_drishti'}`);
    console.log(`   Table Name      : mst_schools`);
    console.log(`   Total Columns   : ${finalCols.rows[0].count} columns`);
    console.log(`   Total Records   : ${parseInt(finalTargetCount.rows[0].count, 10).toLocaleString()} schools`);
    console.log(`   Elapsed Time    : ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

if (require.main === module) {
  migrateMstSchools();
}

module.exports = migrateMstSchools;
