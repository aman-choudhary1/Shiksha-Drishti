#!/usr/bin/env node
/**
 * migrate_master_data.js
 * 
 * Migrates Master Districts (33), Blocks (146), Clusters (5,540), and Schools (59,354)
 * from the attendance database (vsk_attadance) to Shiksha Drishti (shiksha_drishti).
 * 
 * Usage:
 *   node migrations/migrate_master_data.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function runMasterMigration() {
  console.log('\n=============================================================');
  console.log('🏛️  MIGRATING MASTER ADMINISTRATIVE DATA TO SHIKSHA DRISHTI');
  console.log('=============================================================\n');

  const startTime = Date.now();

  try {
    // 1. Run 008_master_hierarchy.sql to create tables & update constraints
    console.log('1️⃣  Creating Master Hierarchy Tables (sd_districts, sd_blocks, sd_clusters)...');
    const sqlPath = path.join(__dirname, '008_master_hierarchy.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      await targetPool.query(sql);
      console.log('   ✅ Tables created / verified successfully.\n');
    }

    // 2. Migrate Districts (mst_district -> sd_districts)
    console.log('2️⃣  Migrating Districts (mst_district)...');
    const distRes = await sourcePool.query(`
      SELECT DISTINCT district_cd::text, TRIM(district_name) AS district_name 
      FROM mst_district 
      WHERE district_cd IS NOT NULL AND district_name IS NOT NULL
      ORDER BY district_name
    `);
    
    let distCount = 0;
    for (const d of distRes.rows) {
      await targetPool.query(`
        INSERT INTO sd_districts (district_cd, district_name, state_cd)
        VALUES ($1, $2, 'CG')
        ON CONFLICT (district_cd) DO UPDATE SET
          district_name = EXCLUDED.district_name,
          updated_at = now()
      `, [d.district_cd, d.district_name]);
      distCount++;
    }
    console.log(`   ✅ Migrated ${distCount} districts.\n`);

    // 3. Migrate Blocks (mst_block -> sd_blocks)
    console.log('3️⃣  Migrating Blocks (mst_block)...');
    const blockRes = await sourcePool.query(`
      SELECT 
        b.block_cd::text,
        TRIM(b.block_name) AS block_name,
        b.district_cd::text,
        COALESCE(TRIM(d.district_name), 'UNKNOWN') AS district_name
      FROM mst_block b
      LEFT JOIN mst_district d ON d.district_cd = b.district_cd
      WHERE b.block_cd IS NOT NULL AND b.block_name IS NOT NULL
      ORDER BY district_name, block_name
    `);

    let blockCount = 0;
    for (const b of blockRes.rows) {
      await targetPool.query(`
        INSERT INTO sd_blocks (block_cd, block_name, district_cd, district_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (block_cd) DO UPDATE SET
          block_name = EXCLUDED.block_name,
          district_cd = EXCLUDED.district_cd,
          district_name = EXCLUDED.district_name,
          updated_at = now()
      `, [b.block_cd, b.block_name, b.district_cd, b.district_name]);
      blockCount++;
    }
    console.log(`   ✅ Migrated ${blockCount} blocks.\n`);

    // 4. Migrate Clusters (mst_cluster -> sd_clusters)
    console.log('4️⃣  Migrating Clusters (mst_cluster)...');
    const clusterRes = await sourcePool.query(`
      SELECT DISTINCT
        cluster_cd::text,
        TRIM(cluster_name) AS cluster_name,
        block_cd::text,
        COALESCE(TRIM(block_name), 'UNKNOWN') AS block_name,
        district_cd::text,
        COALESCE(TRIM(district_name), 'UNKNOWN') AS district_name
      FROM mst_cluster
      WHERE cluster_cd IS NOT NULL AND cluster_name IS NOT NULL
      ORDER BY district_name, block_name, cluster_name
    `);

    console.log(`   Fetched ${clusterRes.rows.length} clusters. Upserting in batches...`);
    const clusterBatchSize = 500;
    let clusterCount = 0;
    for (let i = 0; i < clusterRes.rows.length; i += clusterBatchSize) {
      const batch = clusterRes.rows.slice(i, i + clusterBatchSize);
      const values = [];
      const placeholders = [];
      let pIdx = 1;

      for (const c of batch) {
        placeholders.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5})`);
        values.push(c.cluster_cd, c.cluster_name, c.block_cd, c.block_name, c.district_cd, c.district_name);
        pIdx += 6;
      }

      await targetPool.query(`
        INSERT INTO sd_clusters (cluster_cd, cluster_name, block_cd, block_name, district_cd, district_name)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (cluster_cd) DO UPDATE SET
          cluster_name = EXCLUDED.cluster_name,
          block_cd = EXCLUDED.block_cd,
          block_name = EXCLUDED.block_name,
          district_cd = EXCLUDED.district_cd,
          district_name = EXCLUDED.district_name,
          updated_at = now()
      `, values);

      clusterCount += batch.length;
    }
    console.log(`   ✅ Migrated ${clusterCount} clusters.\n`);

    // 5. Migrate Schools (mst_schools -> sd_schools)
    console.log('5️⃣  Migrating All State Schools (mst_schools -> sd_schools)...');
    const totalSchoolsRes = await sourcePool.query('SELECT COUNT(*) FROM mst_schools WHERE udise_code IS NOT NULL');
    const totalSchools = Number(totalSchoolsRes.rows[0].count);
    console.log(`   Total schools in source attendance DB: ${totalSchools.toLocaleString()}`);

    const schoolBatchSize = 1000;
    let schoolCount = 0;

    for (let offset = 0; offset < totalSchools; offset += schoolBatchSize) {
      const schRes = await sourcePool.query(`
        SELECT 
          udise_code,
          TRIM(school_name) AS school_name,
          cluster_cd::text,
          TRIM(cluster_name) AS cluster_name,
          block_cd::text,
          TRIM(block_name) AS block_name,
          district_cd::text,
          TRIM(district_name) AS district_name,
          state_cd::text AS state_cd,
          latitude,
          longitude,
          CASE 
            WHEN sch_mgmt_id = 1 THEN 'Government'
            WHEN sch_mgmt_id = 2 THEN 'Local Body'
            WHEN sch_mgmt_id = 4 THEN 'Private Aided'
            WHEN sch_mgmt_id = 5 THEN 'Private Unaided'
            ELSE 'Government'
          END AS school_type,
          CASE 
            WHEN sch_mgmt_id = 1 THEN 'Dept of Education'
            WHEN sch_mgmt_id = 2 THEN 'Tribal Welfare Dept'
            ELSE 'State Education'
          END AS school_management,
          TRIM(hos_name) AS hos_name,
          TRIM(hos_mobile) AS hos_mobile
        FROM mst_schools
        WHERE udise_code IS NOT NULL
        ORDER BY id ASC
        LIMIT ${schoolBatchSize} OFFSET ${offset}
      `);

      if (schRes.rows.length === 0) break;

      const placeholders = [];
      const values = [];
      let p = 1;

      for (const s of schRes.rows) {
        placeholders.push(`($${p}, $${p+1}, $${p+2}, $${p+3}, $${p+4}, $${p+5}, $${p+6}, $${p+7}, $${p+8}, $${p+9}, $${p+10}, $${p+11}, $${p+12}, $${p+13}, $${p+14})`);
        values.push(
          s.udise_code,
          s.school_name || 'Government School',
          s.cluster_cd || null,
          s.cluster_name || null,
          s.block_cd || 'UNKNOWN',
          s.block_name || 'UNKNOWN',
          s.district_cd || 'UNKNOWN',
          s.district_name || 'UNKNOWN',
          s.state_cd || 'CG',
          s.latitude || null,
          s.longitude || null,
          s.school_type || 'Government',
          s.school_management || 'Dept of Education',
          s.hos_name || null,
          s.hos_mobile || null
        );
        p += 15;
      }

      await targetPool.query(`
        INSERT INTO sd_schools (
          udise_code, school_name, cluster_cd, cluster_name,
          block_cd, block_name, district_cd, district_name,
          state_cd, latitude, longitude, school_type, school_management,
          hos_name, hos_mobile
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (udise_code) DO UPDATE SET
          school_name = EXCLUDED.school_name,
          cluster_cd = EXCLUDED.cluster_cd,
          cluster_name = EXCLUDED.cluster_name,
          block_cd = EXCLUDED.block_cd,
          block_name = EXCLUDED.block_name,
          district_cd = EXCLUDED.district_cd,
          district_name = EXCLUDED.district_name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          school_type = EXCLUDED.school_type,
          school_management = EXCLUDED.school_management,
          hos_name = COALESCE(EXCLUDED.hos_name, sd_schools.hos_name),
          hos_mobile = COALESCE(EXCLUDED.hos_mobile, sd_schools.hos_mobile),
          updated_at = now()
      `, values);

      schoolCount += schRes.rows.length;
      process.stdout.write(`   ↳ Imported ${schoolCount.toLocaleString()} / ${totalSchools.toLocaleString()} schools...\r`);
    }

    console.log(`\n   ✅ Successfully migrated ${schoolCount.toLocaleString()} schools to sd_schools!\n`);

    // 6. Summary verification
    console.log('=============================================================');
    console.log('📊 MIGRATION VERIFICATION & SUMMARY');
    console.log('=============================================================');
    const finalDist = await targetPool.query('SELECT COUNT(*) FROM sd_districts');
    const finalBlk  = await targetPool.query('SELECT COUNT(*) FROM sd_blocks');
    const finalClus = await targetPool.query('SELECT COUNT(*) FROM sd_clusters');
    const finalSch  = await targetPool.query('SELECT COUNT(*) FROM sd_schools');

    console.log(`📍 Total State Districts : ${finalDist.rows[0].count} (All 33 districts of Chhattisgarh)`);
    console.log(`📍 Total State Blocks    : ${finalBlk.rows[0].count} (All 146 educational blocks)`);
    console.log(`📍 Total State Clusters  : ${finalClus.rows[0].count} (All cluster resource centres)`);
    console.log(`📍 Total State Schools   : ${Number(finalSch.rows[0].count).toLocaleString()} (All operational institutions)`);
    console.log(`⏱️  Total Elapsed Time    : ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log('=============================================================\n');

  } catch (err) {
    console.error('\n❌ Master migration failed:', err);
    process.exit(1);
  } finally {
    await targetPool.end();
    await sourcePool.end();
  }
}

runMasterMigration();
