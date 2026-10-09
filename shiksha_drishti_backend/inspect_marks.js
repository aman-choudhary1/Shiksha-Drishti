const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12345',
  database: 'student_data',
});

async function check() {
  console.log('--- Checking sample exammarkspy values in student_data ---');
  const r1 = await pool.query(`
    SELECT exammarkspy, COUNT(*) as cnt
    FROM student_data
    WHERE studentstatus = '1'
    GROUP BY exammarkspy
    ORDER BY cnt DESC
    LIMIT 30
  `);
  console.log('Sample exammarkspy counts:', r1.rows);

  console.log('--- Checking max, min, avg of exammarkspy in student_data ---');
  const r2 = await pool.query(`
    SELECT
      MIN(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' THEN exammarkspy::numeric END) as min_val,
      MAX(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' THEN exammarkspy::numeric END) as max_val,
      AVG(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND exammarkspy::numeric <= 100 THEN exammarkspy::numeric END) as avg_lte_100,
      AVG(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' THEN exammarkspy::numeric END) as avg_all,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND exammarkspy::numeric > 100 THEN 1 END) as cnt_gt_100,
      COUNT(CASE WHEN exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$' AND exammarkspy::numeric <= 100 THEN 1 END) as cnt_lte_100
    FROM student_data
    WHERE studentstatus = '1'
  `);
  console.log('Stats:', r2.rows[0]);

  console.log('--- Checking distribution of marks > 100 ---');
  const r3 = await pool.query(`
    SELECT
      CASE
        WHEN exammarkspy::numeric <= 100 THEN '<= 100 (percentage / 100 max)'
        WHEN exammarkspy::numeric BETWEEN 101 AND 500 THEN '101 - 500 (total marks out of 500/600)'
        WHEN exammarkspy::numeric BETWEEN 501 AND 1000 THEN '501 - 1000'
        ELSE '> 1000'
      END AS mark_range,
      COUNT(*) as count,
      AVG(exammarkspy::numeric) as avg_val
    FROM student_data
    WHERE studentstatus = '1' AND exammarkspy ~ '^[0-9]+(\\.[0-9]+)?$'
    GROUP BY 1
    ORDER BY count DESC
  `);
  console.log('Distribution:', r3.rows);

  console.log('--- Checking student_analytics_summary marks sum & count ---');
  const r4 = await pool.query(`
    SELECT
      SUM(marks_sum) as total_marks_sum,
      SUM(marks_count) as total_marks_count,
      ROUND(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 2) as overall_avg
    FROM student_analytics_summary
  `);
  console.log('Summary table:', r4.rows[0]);

  await pool.end();
}

check().catch(console.error);
