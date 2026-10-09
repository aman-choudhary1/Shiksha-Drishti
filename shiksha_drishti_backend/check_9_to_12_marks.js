require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.STUDENT_DB_NAME || 'student_data',
});

async function checkClass9to12() {
  console.log('=== Class 9 to 12 students with marks = 999.0 (Classwise breakdown) ===');
  const r1 = await pool.query(`
    SELECT
      sd.classid,
      COUNT(*) as total_students,
      COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END) as count_999,
      ROUND(COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_999,
      COUNT(CASE WHEN sd.exammarkspy ~ '^[0-9.]+$' AND sd.exammarkspy::numeric <= 100 THEN 1 END) as count_valid_marks,
      ROUND(AVG(CASE WHEN sd.exammarkspy ~ '^[0-9.]+$' AND sd.exammarkspy::numeric <= 100 THEN sd.exammarkspy::numeric END), 2) as avg_valid_marks
    FROM student_data sd
    WHERE sd.studentstatus = '1' AND sd.classid IN ('9', '10', '11', '12')
    GROUP BY sd.classid
    ORDER BY sd.classid::numeric;
  `);
  console.table(r1.rows);

  console.log('\n=== Class 9 to 12 Total Summary ===');
  const r2 = await pool.query(`
    SELECT
      COUNT(*) as total_students_9_to_12,
      COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END) as total_999_marks,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9.]+$' AND exammarkspy::numeric <= 100 THEN 1 END) as total_valid_0_to_100_marks,
      ROUND(COUNT(CASE WHEN exammarkspy = '999.0' OR exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as percentage_999
    FROM student_data
    WHERE studentstatus = '1' AND classid IN ('9', '10', '11', '12');
  `);
  console.table(r2.rows);

  console.log('\n=== Breakdown by examresultpy for Class 9-12 students having 999.0 ===');
  const r3 = await pool.query(`
    SELECT
      classid,
      examresultpy,
      CASE examresultpy
        WHEN '1' THEN 'Pass'
        WHEN '0' THEN 'Fail / Repeater'
        WHEN '3' THEN 'Compartment'
        WHEN '4' THEN 'Absent'
        WHEN '5' THEN 'Not Appeared'
        ELSE 'Other/Null'
      END as result_label,
      COUNT(*) as student_count
    FROM student_data
    WHERE studentstatus = '1' 
      AND classid IN ('9', '10', '11', '12')
      AND (exammarkspy = '999.0' OR exammarkspy = '999')
    GROUP BY classid, examresultpy
    ORDER BY classid::numeric, student_count DESC;
  `);
  console.table(r3.rows);

  console.log('\n=== Govt Schools (sch_mgmt_id = 1) Class 9-12 with 999.0 ===');
  const r4 = await pool.query(`
    SELECT
      sd.classid,
      COUNT(*) as govt_students,
      COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END) as govt_999_marks,
      ROUND(COUNT(CASE WHEN sd.exammarkspy = '999.0' OR sd.exammarkspy = '999' THEN 1 END)::numeric / COUNT(*) * 100, 2) as pct_999
    FROM student_data sd
    LEFT JOIN mst_schools m ON m.udise_code = sd.udiseschcode
    WHERE sd.studentstatus = '1' 
      AND COALESCE(m.sch_mgmt_id, 1) = 1
      AND sd.classid IN ('9', '10', '11', '12')
    GROUP BY sd.classid
    ORDER BY sd.classid::numeric;
  `);
  console.table(r4.rows);

  await pool.end();
}

checkClass9to12().catch(console.error);
