require('dotenv').config();
const { Pool } = require('pg');

const studentPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
  max: 10,
});

async function run() {
  const t0 = Date.now();
  console.log('🚀 Re-aggregating student_analytics_summary strictly excluding exammarkspy = 999.0...');

  // 1. Drop & recreate summary table
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

  console.log('Inserting aggregates from student_data (studentstatus = 1 AND exammarkspy != 999.0)...');

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
        WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric BETWEEN 90 AND 100 THEN 'A+ (90-100)'
        WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 75 AND sd.exammarkspy::numeric < 90 THEN 'A  (75-89)'
        WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 60 AND sd.exammarkspy::numeric < 75 THEN 'B  (60-74)'
        WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 45 AND sd.exammarkspy::numeric < 60 THEN 'C  (45-59)'
        WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric >= 33 AND sd.exammarkspy::numeric < 45 THEN 'D  (33-44)'
        WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric < 33 THEN 'Fail (<33)'
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
      COALESCE(SUM(CASE WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric BETWEEN 0 AND 100 THEN sd.exammarkspy::numeric ELSE 0 END), 0) AS marks_sum,
      COUNT(CASE WHEN sd.exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND sd.exammarkspy::numeric BETWEEN 0 AND 100 THEN 1 ELSE NULL END) AS marks_count,
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

  console.log('Creating indexes...');
  await studentPool.query(`CREATE INDEX idx_sas_dist ON student_analytics_summary (district_cd)`);
  await studentPool.query(`CREATE INDEX idx_sas_mgmt ON student_analytics_summary (sch_mgmt_id)`);
  await studentPool.query(`CREATE INDEX idx_sas_class ON student_analytics_summary (classid)`);
  await studentPool.query(`CREATE INDEX idx_sas_dist_mgmt ON student_analytics_summary (district_cd, sch_mgmt_id)`);
  await studentPool.query(`CREATE INDEX idx_sas_combo ON student_analytics_summary (district_cd, sch_mgmt_id, classid)`);

  const stat = await studentPool.query(`
    SELECT
      SUM(total_students) as total_students,
      SUM(marks_sum) as total_marks_sum,
      SUM(marks_count) as total_marks_count,
      ROUND(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 2) as overall_avg,
      ROUND(
        SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END)::numeric /
        NULLIF(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0) * 100, 2
      ) as pass_pct,
      SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END) as passed,
      SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END) as failed,
      SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END) as compartment,
      SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END) as absent
    FROM student_analytics_summary;
  `);

  console.log('\n📊 Re-aggregation Results (excluding 999.0):');
  console.table(stat.rows);

  const govtStat = await studentPool.query(`
    SELECT
      SUM(total_students) as total_students,
      SUM(marks_count) as total_marks_count,
      ROUND(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 2) as govt_avg,
      ROUND(
        SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END)::numeric /
        NULLIF(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0) * 100, 2
      ) as govt_pass_pct,
      SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END) as passed,
      SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END) as failed,
      SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END) as compartment,
      SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END) as absent
    FROM student_analytics_summary
    WHERE sch_mgmt_id = 1;
  `);

  console.log('\n🏛️ Govt Schools (sch_mgmt_id = 1, excluding 999.0):');
  console.table(govtStat.rows);

  const govtPrimary = await studentPool.query(`
    SELECT
      SUM(total_students) as total_students,
      ROUND(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 2) as govt_primary_avg,
      ROUND(
        SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END)::numeric /
        NULLIF(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0) * 100, 2
      ) as govt_primary_pass_pct,
      SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END) as passed,
      SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END) as failed,
      SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END) as compartment,
      SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END) as absent
    FROM student_analytics_summary
    WHERE sch_mgmt_id = 1 AND classid ~ '^[0-9]+$' AND classid::int BETWEEN 1 AND 8;
  `);

  console.log('\n🏛️ Govt Primary Schools (1-8, sch_mgmt_id = 1, excluding 999.0):');
  console.table(govtPrimary.rows);

  console.log(`\n✅ Completed in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  await studentPool.end();
}

run().catch(console.error);
