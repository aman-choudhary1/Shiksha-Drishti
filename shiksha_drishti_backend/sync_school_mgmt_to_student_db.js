/**
 * sync_school_mgmt_to_student_db.js
 * 
 * 1. Copies mst_schools to student_data DB (so we can JOIN directly in PostgreSQL).
 * 2. Re-aggregates student_analytics_summary with sch_mgmt_id included.
 * 3. Enables instant filtering by Government Schools (sch_mgmt_id = 1).
 */
require('dotenv').config();
const { Pool } = require('pg');

const mainPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME || 'shiksha_drishti',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 5,
});

const studentPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.STUDENT_DB_NAME || 'student_data',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  statement_timeout: 0,
});

async function sync() {
  const t0 = Date.now();
  console.log('🚀 Starting School Management (sch_mgmt_id) Sync & Pre-Aggregation...\n');

  try {
    // 1. Create mst_schools in student_data DB if not exists
    console.log('1️⃣ Creating mst_schools table in student_data DB...');
    await studentPool.query(`
      CREATE TABLE IF NOT EXISTS mst_schools (
        udise_code VARCHAR(20) PRIMARY KEY,
        school_name TEXT,
        sch_mgmt_id SMALLINT,
        district_cd VARCHAR(10),
        district_name TEXT,
        block_cd VARCHAR(10),
        block_name TEXT
      );
    `);

    // 2. Fetch schools from main shiksha_drishti DB and insert into student_data DB
    console.log('2️⃣ Copying mst_schools mapping to student_data DB...');
    const schools = await mainPool.query(`
      SELECT udise_code::text, school_name, sch_mgmt_id, district_cd::text, district_name, block_cd::text, block_name 
      FROM mst_schools
    `);
    console.log(`   Found ${schools.rows.length} schools in main DB.`);

    await studentPool.query(`TRUNCATE TABLE mst_schools;`);

    const BATCH_SIZE = 500;
    for (let i = 0; i < schools.rows.length; i += BATCH_SIZE) {
      const slice = schools.rows.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];
      slice.forEach((s, idx) => {
        values.push(s.udise_code, s.school_name, s.sch_mgmt_id, s.district_cd, s.district_name, s.block_cd, s.block_name);
        const base = idx * 7;
        placeholders.push(`($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7})`);
      });
      await studentPool.query(`
        INSERT INTO mst_schools (udise_code, school_name, sch_mgmt_id, district_cd, district_name, block_cd, block_name)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (udise_code) DO UPDATE SET sch_mgmt_id = EXCLUDED.sch_mgmt_id;
      `, values);
    }
    console.log('   ✅ mst_schools copied and indexed in student_data DB.\n');

    // 3. Create or replace student_analytics_summary with sch_mgmt_id
    console.log('3️⃣ Recreating student_analytics_summary table with sch_mgmt_id column...');
    await studentPool.query(`
      DROP TABLE IF EXISTS student_analytics_summary;
      CREATE TABLE student_analytics_summary (
        id SERIAL PRIMARY KEY,
        district_cd VARCHAR(4),
        classid VARCHAR(10),
        gender VARCHAR(5),
        socialcatid VARCHAR(5),
        examresultpy VARCHAR(5),
        grade_band VARCHAR(20),
        sch_mgmt_id SMALLINT DEFAULT 1,
        cwsnyn VARCHAR(5),
        ewsyn VARCHAR(5),
        ooscyn VARCHAR(5),
        isbplyn VARCHAR(5),
        isgiftedchild VARCHAR(5),
        nccnssyn VARCHAR(5),
        total_students INT DEFAULT 0,
        marks_sum NUMERIC DEFAULT 0,
        marks_count INT DEFAULT 0,
        total_schools INT DEFAULT 0
      );
    `);

    // 4. Populate student_analytics_summary by joining student_data with mst_schools
    console.log('4️⃣ Joining 5.75M active students (studentstatus = 1) with mst_schools on udise_code...');
    await studentPool.query(`
      INSERT INTO student_analytics_summary (
        district_cd,
        classid,
        gender,
        socialcatid,
        examresultpy,
        grade_band,
        sch_mgmt_id,
        cwsnyn,
        ewsyn,
        ooscyn,
        isbplyn,
        isgiftedchild,
        nccnssyn,
        total_students,
        marks_sum,
        marks_count,
        total_schools
      )
      SELECT
        SUBSTRING(sd.udiseschcode, 3, 2) AS district_cd,
        sd.classid,
        sd.gender,
        sd.socialcatid,
        sd.examresultpy,
        CASE
          WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric BETWEEN 90 AND 100 THEN 'A+ (90-100)'
          WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 75 AND sd.exammarkspy::numeric < 90 THEN 'A  (75-89)'
          WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 60 AND sd.exammarkspy::numeric < 75 THEN 'B  (60-74)'
          WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 45 AND sd.exammarkspy::numeric < 60 THEN 'C  (45-59)'
          WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 33 AND sd.exammarkspy::numeric < 45 THEN 'D  (33-44)'
          WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric < 33 THEN 'Fail (<33)'
          ELSE 'No Marks'
        END AS grade_band,
        COALESCE(m.sch_mgmt_id, 1) AS sch_mgmt_id,
        sd.cwsnyn,
        sd.ewsyn,
        sd.ooscyn,
        sd.isbplyn,
        sd.isgiftedchild,
        sd.nccnssyn,
        COUNT(*) AS total_students,
        COALESCE(SUM(CASE WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric BETWEEN 0 AND 100 THEN sd.exammarkspy::numeric ELSE 0 END), 0) AS marks_sum,
        COUNT(CASE WHEN sd.exammarkspy ~ '^[0-9]+(\.[0-9]+)?$' AND sd.exammarkspy::numeric BETWEEN 0 AND 100 THEN 1 ELSE NULL END) AS marks_count,
        COUNT(DISTINCT sd.udiseschcode) AS total_schools
      FROM student_data sd
      LEFT JOIN mst_schools m ON m.udise_code = sd.udiseschcode
      WHERE sd.studentstatus = '1'
        AND sd.udiseschcode IS NOT NULL AND LENGTH(sd.udiseschcode) = 11
        AND sd.exammarkspy != '999.0'
        AND sd.exammarkspy != '999'
        AND sd.exammarkspy IS NOT NULL
        AND sd.exammarkspy != 'null'
      GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13;
    `);

    // 5. Create fast multi-column indexes
    console.log('5️⃣ Creating performance indexes...');
    await studentPool.query(`CREATE INDEX idx_sas_dist ON student_analytics_summary (district_cd)`);
    await studentPool.query(`CREATE INDEX idx_sas_mgmt ON student_analytics_summary (sch_mgmt_id)`);
    await studentPool.query(`CREATE INDEX idx_sas_dist_mgmt ON student_analytics_summary (district_cd, sch_mgmt_id)`);
    await studentPool.query(`CREATE INDEX idx_sas_class ON student_analytics_summary (classid)`);

    const summaryCheck = await studentPool.query(`
      SELECT 
        sch_mgmt_id,
        COUNT(*) AS rows,
        SUM(total_students) AS total_students
      FROM student_analytics_summary
      GROUP BY sch_mgmt_id
      ORDER BY total_students DESC
    `);

    console.log('\n📊 Summary breakdown by sch_mgmt_id:');
    summaryCheck.rows.forEach(r => {
      console.log(`  - sch_mgmt_id = ${r.sch_mgmt_id}: ${parseInt(r.total_students).toLocaleString()} students (${r.rows} aggregate rows)`);
    });

    console.log(`\n✅ Completed in ${((Date.now() - t0) / 1000).toFixed(2)}s!`);
  } catch (err) {
    console.error('❌ Sync error:', err);
  } finally {
    mainPool.end();
    studentPool.end();
  }
}

sync();
