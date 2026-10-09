require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function generateFullReport() {
  console.log('=== 1. Total 999.0 Count vs Total Students ===');
  const r1 = await pool.query(`
    SELECT
      COUNT(*) as total_active_students,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as total_999,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_of_total_999,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric <= 100 THEN 1 END) as total_valid_marks,
      ROUND(COUNT(CASE WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric <= 100 THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_valid_marks
    FROM student_data
    WHERE studentstatus = '1';
  `);
  console.table(r1.rows);

  console.log('\n=== 2. Class-by-Class 999.0 Distribution (Every single class from Nursery to 12) ===');
  const r2 = await pool.query(`
    SELECT
      classid,
      CASE classid
        WHEN '-3' THEN 'Nursery / Balvatika 1'
        WHEN '-2' THEN 'LKG / Balvatika 2'
        WHEN '-1' THEN 'UKG / Balvatika 3'
        WHEN '0' THEN 'KG'
        ELSE 'Class ' || classid
      END as class_name,
      COUNT(*) as total_students_in_class,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as count_999,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_of_class,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / 555348 * 100, 2) as share_of_all_999,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric <= 100 THEN 1 END) as count_valid_marks,
      ROUND(AVG(CASE WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric <= 100 THEN exammarkspy::numeric END), 2) as avg_marks_of_valid
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY classid
    ORDER BY classid::numeric;
  `);
  console.table(r2.rows);

  console.log('\n=== 3. Breakdown: examresultpy vs 999.0 marks ===');
  const r3 = await pool.query(`
    SELECT
      examresultpy,
      CASE examresultpy
        WHEN '1' THEN 'Promoted / Passed'
        WHEN '0' THEN 'Not Promoted / Repeater / Failed'
        WHEN '3' THEN 'Promoted with Grace / Compartment'
        WHEN '4' THEN 'Absent in Exam'
        WHEN '5' THEN 'Not Appeared in Exam'
        WHEN '6' THEN 'Detained'
        WHEN '7' THEN 'Other / Direct Promotion'
        ELSE 'Null / Unspecified'
      END as result_meaning,
      COUNT(*) as total_students_with_this_result,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as count_having_999_marks,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_within_this_result,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / 555348 * 100, 2) as share_of_all_999
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY examresultpy
    ORDER BY count_having_999_marks DESC;
  `);
  console.table(r3.rows);

  console.log('\n=== 4. Breakdown by School Management (sch_mgmt_id) ===');
  const r4 = await pool.query(`
    SELECT
      COALESCE(m.sch_mgmt_id, 1) as sch_mgmt_id,
      CASE COALESCE(m.sch_mgmt_id, 1)
        WHEN 1 THEN 'Dept of Education (Govt)'
        WHEN 2 THEN 'Tribal Development'
        WHEN 4 THEN 'Govt Aided'
        WHEN 5 THEN 'Private Unaided'
        WHEN 6 THEN 'Social Welfare'
        WHEN 11 THEN 'Other State Govt'
        WHEN 94 THEN 'Jawahar Navodaya (JNV)'
        WHEN 95 THEN 'Kendriya Vidyalaya (KVS)'
        ELSE 'Other'
      END as mgmt_name,
      COUNT(*) as total_students,
      COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END) as count_999,
      ROUND(COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_within_mgmt,
      ROUND(COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END)::numeric / 555348 * 100, 2) as share_of_all_999
    FROM student_data sd
    LEFT JOIN mst_schools m ON m.udise_code = sd.udiseschcode
    WHERE sd.studentstatus = '1'
    GROUP BY COALESCE(m.sch_mgmt_id, 1)
    ORDER BY count_999 DESC;
  `);
  console.table(r4.rows);

  console.log('\n=== 5. District-wise Top 10 with highest 999.0 marks ===');
  const r5 = await pool.query(`
    SELECT
      SUBSTRING(sd.udiseschcode, 3, 2) as dist_code,
      COUNT(*) as total_students,
      COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END) as count_999,
      ROUND(COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_in_district
    FROM student_data sd
    WHERE sd.studentstatus = '1' AND LENGTH(sd.udiseschcode) = 11
    GROUP BY SUBSTRING(sd.udiseschcode, 3, 2)
    ORDER BY count_999 DESC
    LIMIT 10;
  `);
  console.table(r5.rows);

  await pool.end();
}

generateFullReport().catch(console.error);
