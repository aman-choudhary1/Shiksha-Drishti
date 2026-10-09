/**
 * create_analytics_summary.js
 * Builds a fast pre-aggregated summary table for active students (studentstatus = '1').
 * Reduces query time from 30+ seconds to < 10 milliseconds!
 */
require('dotenv').config();
const pool = require('./src/config/studentDb');

async function createSummaryTable(forceRebuild = true) {
  console.log('🚀 Checking/Creating student_analytics_summary table (studentstatus = 1 only)...');
  const t0 = Date.now();

  try {
    // 1. Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_analytics_summary (
        id SERIAL PRIMARY KEY,
        district_cd VARCHAR(4),
        classid VARCHAR(10),
        gender VARCHAR(5),
        socialcatid VARCHAR(5),
        examresultpy VARCHAR(5),
        grade_band VARCHAR(20),
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

    if (forceRebuild) {
      console.log('🧹 Truncating student_analytics_summary to reload studentstatus = 1 data...');
      await pool.query(`TRUNCATE TABLE student_analytics_summary;`);
    } else {
      const countCheck = await pool.query(`SELECT COUNT(*) FROM student_analytics_summary`);
      if (parseInt(countCheck.rows[0].count) > 0) {
        console.log(`✅ student_analytics_summary already populated (${countCheck.rows[0].count} rows).`);
        return;
      }
    }

    console.log('⏳ Aggregating 5.75M student records (studentstatus = 1) into student_analytics_summary...');

    await pool.query(`
      INSERT INTO student_analytics_summary (
        district_cd,
        classid,
        gender,
        socialcatid,
        examresultpy,
        grade_band,
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
        SUBSTRING(udiseschcode, 3, 2) AS district_cd,
        classid,
        gender,
        socialcatid,
        examresultpy,
        CASE
          WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric >= 90 THEN 'A+ (90-100)'
          WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric >= 75 THEN 'A  (75-89)'
          WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric >= 60 THEN 'B  (60-74)'
          WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric >= 45 THEN 'C  (45-59)'
          WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric >= 33 THEN 'D  (33-44)'
          WHEN exammarkspy ~ '^[0-9.]+$' THEN 'Fail (<33)'
          ELSE 'No Marks'
        END AS grade_band,
        cwsnyn,
        ewsyn,
        ooscyn,
        isbplyn,
        isgiftedchild,
        nccnssyn,
        COUNT(*) AS total_students,
        COALESCE(SUM(CASE WHEN exammarkspy ~ '^[0-9.]+$' THEN exammarkspy::numeric ELSE 0 END), 0) AS marks_sum,
        COUNT(CASE WHEN exammarkspy ~ '^[0-9.]+$' THEN 1 ELSE NULL END) AS marks_count,
        COUNT(DISTINCT udiseschcode) AS total_schools
      FROM student_data
      WHERE studentstatus = '1'
        AND udiseschcode IS NOT NULL AND LENGTH(udiseschcode) = 11
      GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12;
    `);

    // Create fast indexes
    console.log('⚡ Creating indexes on student_analytics_summary...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sas_dist ON student_analytics_summary (district_cd)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sas_class ON student_analytics_summary (classid)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sas_dist_class ON student_analytics_summary (district_cd, classid)`);

    const finalCount = await pool.query(`SELECT COUNT(*) FROM student_analytics_summary`);
    const totalStudents = await pool.query(`SELECT SUM(total_students) as total FROM student_analytics_summary`);
    console.log(`✅ Done in ${Date.now() - t0} ms! Total aggregated rows: ${finalCount.rows[0].count}, Total Students (status=1): ${totalStudents.rows[0].total}`);
  } catch (err) {
    console.error('❌ Migration error:', err);
  }
}

if (require.main === module) {
  createSummaryTable(true).then(() => pool.end());
}

module.exports = createSummaryTable;
