require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'shiksha_drishti', user: 'postgres', password: '12345' });

async function bench() {
  const queries = [
    ['School/Block/Cluster counts', `SELECT COUNT(DISTINCT udise_code) AS total_schools, COUNT(DISTINCT cluster_cd) AS total_clusters, COUNT(DISTINCT block_cd) AS total_blocks FROM sd_schools`],
    ['Students count', `SELECT COUNT(*) FROM sd_students WHERE is_active = true`],
    ['Subject marks student avg CTE', `
      WITH student_avg AS (
        SELECT sm.student_id, AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm WHERE sm.marks_obtained IS NOT NULL GROUP BY sm.student_id
      )
      SELECT COUNT(*), ROUND(AVG(pct)::numeric,1) AS avg, COUNT(*) FILTER (WHERE pct < 40) AS remedial, COUNT(*) FILTER (WHERE pct >= 40) AS pass FROM student_avg
    `],
    ['District performance', `
      WITH da AS (
        SELECT sc.district_cd, sc.district_name, sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        WHERE sm.marks_obtained IS NOT NULL
        GROUP BY sc.district_cd, sc.district_name, sm.student_id
      )
      SELECT district_cd, district_name, COUNT(*) AS eval, ROUND(AVG(pct)::numeric,1) AS avg
      FROM da GROUP BY district_cd, district_name ORDER BY avg DESC
    `],
    ['Subject performance', `
      SELECT s.name, ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END)::numeric, 1) AS avg
      FROM sd_subjects s JOIN sd_subject_marks sm ON sm.subject_id = s.id
      WHERE sm.marks_obtained IS NOT NULL GROUP BY s.id, s.name ORDER BY avg ASC
    `],
    ['Top schools', `
      WITH ss AS (
        SELECT a.school_udise, ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END)::numeric, 1) AS avg_pct
        FROM sd_assessments a JOIN sd_subject_marks sm ON sm.assessment_id = a.id
        WHERE sm.marks_obtained IS NOT NULL GROUP BY a.school_udise HAVING COUNT(DISTINCT sm.student_id) >= 1
      )
      SELECT sc.school_name, sc.district_name, ss.avg_pct FROM ss JOIN sd_schools sc ON sc.udise_code = ss.school_udise ORDER BY ss.avg_pct DESC LIMIT 10
    `],
    ['Monthly trend', `
      SELECT TO_CHAR(DATE_TRUNC('month', a.created_at), 'Mon YY'), COUNT(DISTINCT a.id)
      FROM sd_assessments a WHERE a.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY 1 ORDER BY 1
    `],
  ];

  console.log('\n=== QUERY BENCHMARK ===\n');
  for (const [name, sql] of queries) {
    const t0 = Date.now();
    const r = await pool.query(sql);
    const ms = Date.now() - t0;
    const status = ms < 500 ? '✅' : ms < 2000 ? '⚠️' : '❌';
    console.log(`${status} ${name}: ${ms}ms (${r.rows.length} rows)`);
    if (r.rows.length > 0 && r.rows.length <= 10) console.log('  ', JSON.stringify(r.rows).slice(0, 200));
  }
  console.log('\n');
  await pool.end();
}
bench().catch(e => { console.error(e.message); process.exit(1); });
