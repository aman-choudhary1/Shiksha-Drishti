const pool = require('../config/db');
const cache = require('../utils/cache');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Specific SQL Filter Builders (Zero Table Alias Conflicts) ────────────────

// 1. School filter (sc)
function getSchoolFilter(query) {
  const { district, search } = query || {};
  const conds = [];
  const params = [];

  if (district && district !== 'ALL') {
    params.push(district);
    conds.push(`(sc.district_name ILIKE $${params.length} OR sc.district_cd = $${params.length})`);
  }
  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    conds.push(`(sc.school_name ILIKE $${params.length} OR sc.block_name ILIKE $${params.length} OR sc.district_name ILIKE $${params.length})`);
  }

  const whereClause = conds.length > 0 ? ' AND ' + conds.join(' AND ') : '';
  const whereOnly = conds.length > 0 ? ' WHERE ' + conds.join(' AND ') : '';
  return { params, whereClause, whereOnly };
}

// 2. Student filter (st, sc, c)
function getStudentFilter(query) {
  const { district, class_name, search } = query || {};
  const conds = ['st.is_active = true'];
  const params = [];

  if (district && district !== 'ALL') {
    params.push(district);
    conds.push(`(sc.district_name ILIKE $${params.length} OR sc.district_cd = $${params.length})`);
  }
  if (class_name && class_name !== 'ALL') {
    params.push(class_name);
    conds.push(`(c.class_name ILIKE $${params.length} OR c.class_name = $${params.length})`);
  }
  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    conds.push(`(st.student_name ILIKE $${params.length} OR sc.school_name ILIKE $${params.length} OR sc.district_name ILIKE $${params.length})`);
  }

  const whereOnly = ' WHERE ' + conds.join(' AND ');
  const whereClause = ' AND ' + conds.join(' AND ');
  return { params, whereOnly, whereClause };
}

// 3. Teacher filter (u, sc)
function getTeacherFilter(query) {
  const { district, search } = query || {};
  const params = ['TEACHER', true];
  const conds = ['u.role = $1', 'u.is_active = $2'];

  if (district && district !== 'ALL') {
    params.push(district);
    conds.push(`(sc.district_name ILIKE $${params.length} OR sc.district_cd = $${params.length})`);
  }
  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    conds.push(`(u.full_name ILIKE $${params.length} OR sc.school_name ILIKE $${params.length} OR sc.district_name ILIKE $${params.length})`);
  }

  const whereOnly = ' WHERE ' + conds.join(' AND ');
  const whereClause = ' AND ' + conds.join(' AND ');
  return { params, whereOnly, whereClause };
}

// 4. Marks & assessment full join filter (sm/qm, a, sc, c, s)
function getMarksFilter(query) {
  const { district, class_name, subject, search } = query || {};
  const conds = [];
  const params = [];

  if (district && district !== 'ALL') {
    params.push(district);
    conds.push(`(sc.district_name ILIKE $${params.length} OR sc.district_cd = $${params.length})`);
  }
  if (class_name && class_name !== 'ALL') {
    params.push(class_name);
    conds.push(`(c.class_name ILIKE $${params.length} OR c.class_name = $${params.length})`);
  }
  if (subject && subject !== 'ALL') {
    params.push(`%${subject}%`);
    conds.push(`(s.name ILIKE $${params.length} OR s.code ILIKE $${params.length})`);
  }
  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    conds.push(`(sc.school_name ILIKE $${params.length} OR sc.block_name ILIKE $${params.length} OR sc.district_name ILIKE $${params.length})`);
  }

  const whereClause = conds.length > 0 ? ' AND ' + conds.join(' AND ') : '';
  const whereOnly = conds.length > 0 ? ' WHERE ' + conds.join(' AND ') : '';
  return { params, whereClause, whereOnly };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/state/overview — Dynamic multi-dimension filter enabled
// ─────────────────────────────────────────────────────────────────────────────
const getStateOverview = asyncHandler(async (req, res) => {
  const cacheKey = `state:overview:${JSON.stringify(req.query || {})}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  const { tier, district } = req.query;

  const sf  = getSchoolFilter(req.query);
  const stf = getStudentFilter(req.query);
  const tf  = getTeacherFilter(req.query);
  const mf  = getMarksFilter(req.query);

  // Run all independent queries in parallel with dedicated filters
  // Run in two balanced batches to avoid exhausting DB connection pool
  const [
    schoolRes,
    studentRes,
    teacherRes,
    assessRes,
    marksRes,
    districtPerfRes,
  ] = await Promise.all([

    // 1. Schools, blocks, clusters count
    pool.query(`
      SELECT
        COUNT(DISTINCT sc.udise_code)  AS total_schools,
        COUNT(DISTINCT sc.cluster_cd)  AS total_clusters,
        COUNT(DISTINCT sc.block_cd)    AS total_blocks,
        COUNT(DISTINCT sc.district_cd) AS total_districts
      FROM sd_schools sc
      ${sf.whereOnly}
    `, sf.params),

    // 2. Students enrolled + gender
    pool.query(`
      SELECT
        COUNT(DISTINCT st.id)                                                          AS total_students,
        COUNT(DISTINCT st.id) FILTER (WHERE UPPER(st.gender) IN ('M','MALE','BOY'))    AS male_students,
        COUNT(DISTINCT st.id) FILTER (WHERE UPPER(st.gender) IN ('F','FEMALE','GIRL')) AS female_students
      FROM sd_students st
      LEFT JOIN sd_schools sc ON sc.udise_code = st.school_udise
      LEFT JOIN sd_classes c  ON c.id = st.class_id
      ${stf.whereOnly}
    `, stf.params),

    // 3. Teachers
    pool.query(`
      SELECT COUNT(DISTINCT u.id) AS total_teachers
      FROM sd_users u
      LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id AND ta.is_active = true
      LEFT JOIN sd_schools sc ON sc.udise_code = COALESCE(ta.school_udise, u.primary_udise)
      ${tf.whereOnly}
    `, tf.params),

    // 4. Assessments
    pool.query(`
      SELECT
        COUNT(DISTINCT a.id)                                          AS total_assessments,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SUBMITTED')  AS submitted_assessments
      FROM sd_assessments a
      LEFT JOIN sd_schools sc ON sc.udise_code = a.school_udise
      LEFT JOIN sd_classes c  ON c.id = a.class_id
      LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id
      LEFT JOIN sd_subjects s ON s.id = sm.subject_id
      WHERE 1=1 ${mf.whereClause}
    `, mf.params),

    // 5. Marks summary using materialized-style aggregation
    pool.query(`
      WITH student_avg AS (
        SELECT sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0
                   ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
              END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments   a  ON a.id = sm.assessment_id
        JOIN sd_schools        sc ON sc.udise_code = a.school_udise
        JOIN sd_classes        c  ON c.id = a.class_id
        JOIN sd_subjects       s  ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL
          ${mf.whereClause}
        GROUP BY sm.student_id
      )
      SELECT
        COUNT(*)                                       AS evaluated_students,
        ROUND(COALESCE(AVG(pct), 0)::numeric, 1)       AS state_avg_score,
        COUNT(*) FILTER (WHERE pct >= 85)              AS a_plus,
        COUNT(*) FILTER (WHERE pct >= 70 AND pct < 85) AS a_grade,
        COUNT(*) FILTER (WHERE pct >= 55 AND pct < 70) AS b_grade,
        COUNT(*) FILTER (WHERE pct >= 40 AND pct < 55) AS c_grade,
        COUNT(*) FILTER (WHERE pct <  40)              AS remedial_count,
        COUNT(*) FILTER (WHERE pct >= 40)              AS pass_count,
        COUNT(*) FILTER (WHERE pct >= 70)              AS high_achievers
      FROM student_avg
    `, mf.params),

    // 6. District performance
    pool.query(`
      WITH da AS (
        SELECT sc.district_cd, sc.district_name,
          sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0
                   ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
              END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments   a  ON a.id = sm.assessment_id
        JOIN sd_schools        sc ON sc.udise_code = a.school_udise
        JOIN sd_classes        c  ON c.id = a.class_id
        JOIN sd_subjects       s  ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL
          ${mf.whereClause}
        GROUP BY sc.district_cd, sc.district_name, sm.student_id
      )
      SELECT
        district_cd, district_name,
        COUNT(*)                                      AS evaluated_students,
        ROUND(COALESCE(AVG(pct), 0)::numeric, 1)      AS avg_score_pct,
        COUNT(*) FILTER (WHERE pct >= 40)             AS pass_students,
        COUNT(*) FILTER (WHERE pct >= 70)             AS high_achievers,
        COUNT(*) FILTER (WHERE pct <  40)             AS remedial_students
      FROM da
      GROUP BY district_cd, district_name
      ORDER BY avg_score_pct DESC
    `, mf.params),
  ]);

  const [
    subjectRes,
    classRes,
    topSchoolsRes,
    criticalSchoolsRes,
    teacherComplianceRes,
    trendRes,
  ] = await Promise.all([

    // 7. Subject performance
    pool.query(`
      SELECT
        s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
        ROUND(COALESCE(AVG(CASE WHEN sm.is_absent THEN 0
                                ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
                           END), 0)::numeric, 1)   AS avg_score_pct,
        COUNT(DISTINCT sm.student_id)              AS student_count,
        COUNT(DISTINCT sm.student_id) FILTER (
          WHERE sm.is_absent = false
            AND sm.marks_obtained / NULLIF(sm.max_marks, 0) < 0.4
        )                                          AS weak_students_count
      FROM sd_subjects s
      JOIN sd_subject_marks sm ON sm.subject_id = s.id
      JOIN sd_assessments   a  ON a.id = sm.assessment_id
      JOIN sd_schools        sc ON sc.udise_code = a.school_udise
      JOIN sd_classes        c  ON c.id = a.class_id
      WHERE sm.marks_obtained IS NOT NULL
        ${mf.whereClause}
      GROUP BY s.id, s.name, s.code
      ORDER BY avg_score_pct ASC
    `, mf.params),

    // 8. Class-wise performance
    pool.query(`
      SELECT
        c.id AS class_id, c.class_name, c.class_num,
        ROUND(COALESCE(AVG(CASE WHEN sm.is_absent THEN 0
                                ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
                           END), 0)::numeric, 1)  AS avg_score_pct,
        COUNT(DISTINCT sm.student_id)             AS evaluated_students,
        COUNT(DISTINCT sm.student_id) FILTER (
          WHERE sm.is_absent = false
            AND sm.marks_obtained / NULLIF(sm.max_marks, 0) < 0.4
        )                                         AS remedial_students
      FROM sd_classes c
      JOIN sd_assessments   a  ON a.class_id = c.id
      JOIN sd_subject_marks sm ON sm.assessment_id = a.id
      JOIN sd_schools        sc ON sc.udise_code = a.school_udise
      JOIN sd_subjects       s  ON s.id = sm.subject_id
      WHERE sm.marks_obtained IS NOT NULL
        ${mf.whereClause}
      GROUP BY c.id, c.class_name, c.class_num
      ORDER BY c.class_num ASC
    `, mf.params),

    // 9. Top schools
    pool.query(`
      WITH ss AS (
        SELECT a.school_udise,
          ROUND(AVG(CASE WHEN sm.is_absent THEN 0
                         ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
                    END)::numeric, 1) AS avg_pct,
          COUNT(DISTINCT sm.student_id) AS evaluated
        FROM sd_assessments   a
        JOIN sd_subject_marks sm ON sm.assessment_id = a.id
        JOIN sd_schools        sc ON sc.udise_code = a.school_udise
        JOIN sd_classes        c  ON c.id = a.class_id
        JOIN sd_subjects       s  ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL
          ${mf.whereClause}
        GROUP BY a.school_udise
        HAVING COUNT(DISTINCT sm.student_id) >= 1
      )
      SELECT sc.udise_code, sc.school_name, sc.block_name, sc.district_name, sc.school_type,
             ss.avg_pct AS avg_score_pct, ss.evaluated AS evaluated_students
      FROM ss JOIN sd_schools sc ON sc.udise_code = ss.school_udise
      ORDER BY ss.avg_pct DESC LIMIT 15
    `, mf.params),

    // 10. Critical schools (lowest)
    pool.query(`
      WITH ss AS (
        SELECT a.school_udise,
          ROUND(AVG(CASE WHEN sm.is_absent THEN 0
                         ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
                    END)::numeric, 1) AS avg_pct,
          COUNT(DISTINCT sm.student_id) AS evaluated
        FROM sd_assessments   a
        JOIN sd_subject_marks sm ON sm.assessment_id = a.id
        JOIN sd_schools        sc ON sc.udise_code = a.school_udise
        JOIN sd_classes        c  ON c.id = a.class_id
        JOIN sd_subjects       s  ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL
          ${mf.whereClause}
        GROUP BY a.school_udise
        HAVING COUNT(DISTINCT sm.student_id) >= 1
      )
      SELECT sc.udise_code, sc.school_name, sc.block_name, sc.district_name,
             sc.hos_name, sc.hos_mobile,
             ss.avg_pct AS avg_score_pct, ss.evaluated AS evaluated_students
      FROM ss JOIN sd_schools sc ON sc.udise_code = ss.school_udise
      WHERE ss.avg_pct < 60
      ORDER BY ss.avg_pct ASC LIMIT 15
    `, mf.params),

    // 11. Teacher compliance by district
    pool.query(`
      SELECT
        sc.district_cd, sc.district_name,
        COUNT(DISTINCT u.id)                                                AS total_teachers,
        COUNT(DISTINCT a.id)                                                AS total_assessments,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SUBMITTED')        AS submitted_assessments
      FROM sd_users u
      LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id AND ta.is_active = true
      LEFT JOIN sd_schools  sc ON sc.udise_code = COALESCE(ta.school_udise, u.primary_udise)
      LEFT JOIN sd_assessments a ON a.created_by = u.id
      LEFT JOIN sd_classes c ON c.id = a.class_id
      LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id
      LEFT JOIN sd_subjects s ON s.id = sm.subject_id
      WHERE u.role = 'TEACHER' AND u.is_active = true AND sc.district_cd IS NOT NULL
        ${mf.whereClause}
      GROUP BY sc.district_cd, sc.district_name
      ORDER BY sc.district_name ASC
    `, mf.params),

    // 12. Monthly trend
    pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', a.created_at), 'Mon YY') AS month_label,
        DATE_TRUNC('month', a.created_at)                    AS month_ts,
        COUNT(DISTINCT a.id)                                  AS assessments_created,
        COUNT(DISTINCT a.school_udise)                        AS schools_active
      FROM sd_assessments a
      LEFT JOIN sd_schools sc ON sc.udise_code = a.school_udise
      LEFT JOIN sd_classes c  ON c.id = a.class_id
      LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id
      LEFT JOIN sd_subjects s ON s.id = sm.subject_id
      WHERE a.created_at >= NOW() - INTERVAL '12 months'
        ${mf.whereClause}
      GROUP BY month_ts, month_label
      ORDER BY month_ts ASC
    `, mf.params),
  ]);

  // ── Extract data ───────────────────────────────────────────────────────────
  const sch   = schoolRes.rows[0] || {};
  const stu   = studentRes.rows[0] || {};
  const score = marksRes.rows[0] || {};

  const totalSchools    = Number(sch.total_schools || 0);
  const totalClusters   = Number(sch.total_clusters || 0);
  const totalBlocks     = Number(sch.total_blocks || 0);
  const totalDistricts  = Number(sch.total_districts || 0);
  const totalStudents   = Number(stu.total_students || 0);
  const maleStudents    = Number(stu.male_students || 0);
  const femaleStudents  = Number(stu.female_students || 0);
  const totalTeachers   = Number(teacherRes.rows[0]?.total_teachers || 0);
  const totalAssess     = Number(assessRes.rows[0]?.total_assessments || 0);
  const submittedAssess = Number(assessRes.rows[0]?.submitted_assessments || 0);
  const assessCompliance = totalAssess > 0 ? Math.round((submittedAssess / totalAssess) * 100) : 84;

  const evaluatedCount  = Number(score?.evaluated_students || 0);
  const passCount       = Number(score?.pass_count || 0);
  const remedialCount   = Number(score?.remedial_count || 0);
  const stateAvgScore   = Number(score?.state_avg_score || 0);
  const highAchievers   = Number(score?.high_achievers || 0);
  const passRate        = evaluatedCount > 0 ? Math.round((passCount / evaluatedCount) * 100) : 0;
  const highAchieversPct = evaluatedCount > 0 ? Math.round((highAchievers / evaluatedCount) * 100) : 0;
  const genderRatio = totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 52;

  // ── District performance ───────────────────────────────────────────────────
  let districtPerformance = districtPerfRes.rows.map((d, idx) => {
    const evalSt  = Number(d.evaluated_students || 0);
    const passSt  = Number(d.pass_students || 0);
    const passR   = evalSt > 0 ? Math.round((passSt / evalSt) * 100) : 0;
    const avgScore = Number(d.avg_score_pct || 0);
    return {
      rank:               idx + 1,
      district_cd:        d.district_cd,
      district_name:      d.district_name,
      evaluated_students: evalSt,
      avg_score_pct:      avgScore,
      pass_rate_pct:      passR,
      high_achievers:     Number(d.high_achievers || 0),
      remedial_students:  Number(d.remedial_students || 0),
      performance_tier:   avgScore >= 75 ? 'Excellent' : avgScore >= 65 ? 'Good' : avgScore >= 55 ? 'Average' : 'Needs Attention',
      trend:              avgScore >= 65 ? 'up' : 'down',
    };
  });

  if (tier && tier !== 'ALL') {
    districtPerformance = districtPerformance.filter(d => d.performance_tier === tier);
  }

  // ── State Directives ───────────────────────────────────────────────────────
  const worstSubject = subjectRes.rows[0]?.subject_name || 'Mathematics';
  const topDistrict  = districtPerformance[0]?.district_name || 'Raipur';
  const topScore     = districtPerformance[0]?.avg_score_pct || 70;

  const stateDirectives = [
    {
      id: 'SD-001',
      title: 'State-Level Remedial Campaign — Project ARISE',
      priority: 'CRITICAL', badge: 'Immediate Action Required', scope: district && district !== 'ALL' ? district : 'State-Wide',
      detail: `${remedialCount.toLocaleString()} students are scoring below 40% in core assessments. Launch Project ARISE — a 3-month structured remediation campaign with SCERT module delivery via all BEOs and CACs.`,
      action: 'Issue State Directive', impact: `${remedialCount} students`,
    },
    {
      id: 'SD-002',
      title: `${worstSubject} Curriculum Quality Intervention`,
      priority: 'HIGH', badge: 'DEO Action Required', scope: 'Core Subject',
      detail: `${worstSubject} shows the lowest mastery score. Issue directive to all DEOs to organize teacher capacity workshops within 30 days with DIET support.`,
      action: 'Issue DEO Circular', impact: 'Affected schools',
    },
    {
      id: 'SD-003',
      title: `Best Practice Replication from ${topDistrict}`,
      priority: 'POSITIVE', badge: 'Scale Excellence', scope: topDistrict,
      detail: `${topDistrict} leads with ${topScore}% academic mastery. Document their teaching methodology and CAC visit cadence for replication in lower-performing districts.`,
      action: 'Launch Mentoring Program', impact: `Scale benchmarks`,
    },
    {
      id: 'SD-004',
      title: 'Assessment Submission Compliance Drive',
      priority: 'MEDIUM', badge: 'Data Governance', scope: 'All Blocks',
      detail: `Current assessment submission rate is ${assessCompliance}%. Issue BEO-level accountability directive for 100% submission with weekly monitoring and escalation protocol.`,
      action: 'Issue Compliance Mandate', impact: `${assessCompliance}% → 100%`,
    },
  ];

  // ── Teacher compliance ─────────────────────────────────────────────────────
  const teacherCompliance = teacherComplianceRes.rows.map(t => {
    const total = Number(t.total_assessments || 0);
    const sub   = Number(t.submitted_assessments || 0);
    return {
      district_cd:           t.district_cd,
      district_name:         t.district_name,
      total_teachers:        Number(t.total_teachers || 0),
      total_assessments:     total,
      submitted_assessments: sub,
      compliance_rate:       total > 0 ? Math.round((sub / total) * 100) : 0,
    };
  });

  const responseData = {
    state: {
      state_name:      'CHHATTISGARH',
      officer_name:    req.user?.full_name || 'State Administrator',
      total_districts: totalDistricts,
      total_blocks:    totalBlocks,
      total_clusters:  totalClusters,
      total_schools:   totalSchools,
    },
    kpis: {
      total_districts:         totalDistricts,
      total_blocks:            totalBlocks,
      total_clusters:          totalClusters,
      total_schools:           totalSchools,
      total_students:          totalStudents,
      male_students:           maleStudents,
      female_students:         femaleStudents,
      gender_ratio_girls_pct:  genderRatio,
      total_teachers:          totalTeachers,
      total_assessments:       totalAssess,
      assessment_compliance:   assessCompliance,
      state_avg_score:         stateAvgScore,
      pass_rate_pct:           passRate,
      remedial_count:          remedialCount,
      high_achievers_count:    highAchievers,
      high_achievers_pct:      highAchieversPct,
      critical_schools_count:  criticalSchoolsRes.rows.length,
    },
    grade_distribution: {
      a_plus:   Number(score?.a_plus   || 0),
      a:        Number(score?.a_grade  || 0),
      b:        Number(score?.b_grade  || 0),
      c:        Number(score?.c_grade  || 0),
      remedial: remedialCount,
    },
    district_performance: districtPerformance,
    subjects: subjectRes.rows.map(s => ({
      subject_id:          s.subject_id,
      subject_name:        s.subject_name,
      subject_code:        s.subject_code,
      avg_score_pct:       Number(s.avg_score_pct || 0),
      student_count:       Number(s.student_count || 0),
      weak_students_count: Number(s.weak_students_count || 0),
    })),
    class_performance: classRes.rows.map(c => ({
      class_id:           c.class_id,
      class_name:         c.class_name,
      class_num:          Number(c.class_num),
      avg_score_pct:      Number(c.avg_score_pct || 0),
      evaluated_students: Number(c.evaluated_students || 0),
      remedial_students:  Number(c.remedial_students || 0),
    })),
    top_schools: topSchoolsRes.rows.map(s => ({
      udise:              String(s.udise_code),
      school_name:        s.school_name,
      block_name:         s.block_name,
      district_name:      s.district_name,
      school_type:        s.school_type,
      avg_score_pct:      Number(s.avg_score_pct || 0),
      evaluated_students: Number(s.evaluated_students || 0),
    })),
    critical_schools: criticalSchoolsRes.rows.map(s => ({
      udise:              String(s.udise_code),
      school_name:        s.school_name,
      block_name:         s.block_name,
      district_name:      s.district_name,
      hos_name:           s.hos_name,
      hos_mobile:         s.hos_mobile,
      avg_score_pct:      Number(s.avg_score_pct || 0),
      evaluated_students: Number(s.evaluated_students || 0),
    })),
    teacher_compliance: teacherCompliance,
    monthly_trend: trendRes.rows.map(m => ({
      month:          m.month_label,
      assessments:    Number(m.assessments_created || 0),
      schools_active: Number(m.schools_active || 0),
    })),
    state_directives: stateDirectives,
  };

  cache.set(cacheKey, responseData, 60); // 1 minute cache
  res.json(responseData);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/state/districts — Full district league table with filters
// ─────────────────────────────────────────────────────────────────────────────
const getStateDistricts = asyncHandler(async (req, res) => {
  const cacheKey = `state:districts:${JSON.stringify(req.query || {})}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  const { tier } = req.query;
  const sf  = getSchoolFilter(req.query);
  const stf = getStudentFilter(req.query);
  const tf  = getTeacherFilter(req.query);
  const mf  = getMarksFilter(req.query);

  const [infraRes, academicRes, studentCountRes, teacherCountRes] = await Promise.all([
    // Infrastructure
    pool.query(`
      SELECT sc.district_cd, sc.district_name,
        COUNT(DISTINCT sc.udise_code) AS school_count,
        COUNT(DISTINCT sc.block_cd)   AS block_count,
        COUNT(DISTINCT sc.cluster_cd) AS cluster_count
      FROM sd_schools sc
      ${sf.whereOnly}
      GROUP BY sc.district_cd, sc.district_name
    `, sf.params),
    // Academic performance
    pool.query(`
      WITH da AS (
        SELECT sc.district_cd, sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0
                   ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
              END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL
          ${mf.whereClause}
        GROUP BY sc.district_cd, sm.student_id
      )
      SELECT district_cd,
        COUNT(*)                                  AS evaluated_students,
        ROUND(COALESCE(AVG(pct), 0)::numeric, 1)  AS avg_score_pct,
        COUNT(*) FILTER (WHERE pct >= 40)         AS pass_students,
        COUNT(*) FILTER (WHERE pct >= 70)         AS high_achievers,
        COUNT(*) FILTER (WHERE pct <  40)         AS remedial_students
      FROM da GROUP BY district_cd
    `, mf.params),
    // Student counts
    pool.query(`
      SELECT sc.district_cd, COUNT(DISTINCT st.id) AS enrolled_students
      FROM sd_students st
      JOIN sd_schools sc ON sc.udise_code = st.school_udise
      LEFT JOIN sd_classes c ON c.id = st.class_id
      ${stf.whereOnly}
      GROUP BY sc.district_cd
    `, stf.params),
    // Teacher counts
    pool.query(`
      SELECT sc.district_cd, COUNT(DISTINCT u.id) AS teacher_count
      FROM sd_users u
      LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id AND ta.is_active = true
      LEFT JOIN sd_schools sc ON sc.udise_code = COALESCE(ta.school_udise, u.primary_udise)
      ${tf.whereOnly} AND sc.district_cd IS NOT NULL
      GROUP BY sc.district_cd
    `, tf.params),
  ]);

  // Build lookup maps
  const academicMap = {};
  academicRes.rows.forEach(r => { academicMap[r.district_cd] = r; });
  const studentMap = {};
  studentCountRes.rows.forEach(r => { studentMap[r.district_cd] = Number(r.enrolled_students || 0); });
  const teacherMap = {};
  teacherCountRes.rows.forEach(r => { teacherMap[r.district_cd] = Number(r.teacher_count || 0); });

  let districts = infraRes.rows.map((d, idx) => {
    const ac = academicMap[d.district_cd] || {};
    const evalSt   = Number(ac.evaluated_students || 0);
    const passSt   = Number(ac.pass_students || 0);
    const passRate = evalSt > 0 ? Math.round((passSt / evalSt) * 100) : 0;
    const avgScore = Number(ac.avg_score_pct || 0);
    return {
      rank:               idx + 1,
      district_cd:        d.district_cd,
      district_name:      d.district_name,
      school_count:       Number(d.school_count || 0),
      block_count:        Number(d.block_count || 0),
      cluster_count:      Number(d.cluster_count || 0),
      enrolled_students:  studentMap[d.district_cd] || 0,
      teacher_count:      teacherMap[d.district_cd] || 0,
      evaluated_students: evalSt,
      avg_score_pct:      avgScore,
      pass_rate_pct:      passRate,
      high_achievers:     Number(ac.high_achievers || 0),
      remedial_students:  Number(ac.remedial_students || 0),
      performance_tier:   avgScore >= 75 ? 'Excellent' : avgScore >= 65 ? 'Good' : avgScore >= 55 ? 'Average' : 'Needs Attention',
    };
  });

  if (tier && tier !== 'ALL') {
    districts = districts.filter(d => d.performance_tier === tier);
  }

  districts = districts.sort((a, b) => b.avg_score_pct - a.avg_score_pct).map((d, i) => ({ ...d, rank: i + 1 }));

  const responseData = { districts, count: districts.length };
  cache.set(cacheKey, responseData, 60); // 1 minute cache
  res.json(responseData);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/state/questions — State-wide question hotspot analysis
// ─────────────────────────────────────────────────────────────────────────────
const getStateQuestionAnalytics = asyncHandler(async (req, res) => {
  const { priority } = req.query;
  const mf = getMarksFilter(req.query);

  const { rows } = await pool.query(`
    SELECT
      qm.question_id,
      q.question_number,
      q.max_marks,
      s.id   AS subject_id,
      s.name AS subject_name,
      s.code AS subject_code,
      c.class_name, c.class_num,
      COUNT(DISTINCT sc.district_cd)  AS affected_districts_count,
      COUNT(DISTINCT sc.block_cd)     AS affected_blocks_count,
      COUNT(DISTINCT a.school_udise)  AS evaluated_schools_count,
      COUNT(DISTINCT qm.student_id)   AS students_tested,
      ROUND(COALESCE(AVG(CASE WHEN qm.is_absent = false
                              THEN (qm.marks_obtained::numeric / NULLIF(qm.max_marks, 0)) * 100
                              ELSE NULL END), 60)::numeric, 1) AS avg_score_pct,
      COUNT(*) FILTER (
        WHERE qm.is_absent = false
          AND (qm.marks_obtained::numeric / NULLIF(qm.max_marks, 0)) < 0.4
      ) AS weak_students_count
    FROM sd_question_marks qm
    JOIN sd_questions  q  ON q.id = qm.question_id
    JOIN sd_subjects   s  ON s.id = qm.subject_id
    JOIN sd_assessments a ON a.id = qm.assessment_id
    JOIN sd_classes    c  ON c.id = a.class_id
    JOIN sd_schools    sc ON sc.udise_code = a.school_udise
    WHERE 1=1 ${mf.whereClause}
    GROUP BY qm.question_id, q.question_number, q.max_marks,
             s.id, s.name, s.code, c.class_name, c.class_num
    ORDER BY c.class_num ASC, avg_score_pct ASC
  `, mf.params);

  let questions = rows.map(r => {
    const avgPct    = Number(r.avg_score_pct || 60);
    const weakCount = Number(r.weak_students_count || 0);
    const distCount = Number(r.affected_districts_count || 1);
    const blkCount  = Number(r.affected_blocks_count || 1);
    const schCount  = Number(r.evaluated_schools_count || 1);
    const qNum      = r.question_number || 'Q01';

    let revisionPriority = 'ON_TRACK';
    let directive = `Question ${qNum} performance is satisfactory (${avgPct}%) at state level.`;

    if (avgPct < 45 || weakCount >= 30) {
      revisionPriority = 'STATE_INTERVENTION_URGENT';
      directive = `Critical state-wide gap: ${r.class_name} ${r.subject_name} (${qNum}) below 45% across ${distCount} districts, ${blkCount} blocks, ${schCount} schools. Issue emergency SCERT-guided remediation modules.`;
    } else if (avgPct < 60 || weakCount >= 15) {
      revisionPriority = 'DISTRICT_WORKSHOP';
      directive = `Issue directive to DEOs in affected districts to organize ${r.subject_name} (${qNum}) remediation across ${blkCount} blocks.`;
    } else if (avgPct < 75) {
      revisionPriority = 'MODERATE_PRACTICE';
      directive = `CACs to provide targeted practice worksheets for ${qNum} in ${r.class_name} ${r.subject_name}.`;
    }

    return {
      question_id:              r.question_id,
      lo_code:                  `Q-${r.subject_code}-${qNum}`,
      question_number:          qNum,
      description:              `Question ${qNum} (${r.max_marks} Marks)`,
      class_name:               r.class_name,
      class_num:                r.class_num,
      subject_name:             r.subject_name,
      subject_code:             r.subject_code,
      max_marks:                Number(r.max_marks || 10),
      avg_score_pct:            avgPct,
      students_tested:          Number(r.students_tested || 0),
      weak_students_count:      weakCount,
      affected_districts_count: distCount,
      affected_blocks_count:    blkCount,
      evaluated_schools_count:  schCount,
      revision_priority:        revisionPriority,
      state_directive:          directive,
      status: avgPct >= 75 ? 'MASTERED' : avgPct >= 55 ? 'DEVELOPING' : 'NEEDS_INTERVENTION',
    };
  });

  if (priority && priority !== 'ALL') {
    questions = questions.filter(q => q.revision_priority === priority);
  }

  res.json({
    questions,
    summary: {
      total_questions:          questions.length,
      state_intervention_count: questions.filter(q => q.revision_priority === 'STATE_INTERVENTION_URGENT').length,
      district_workshop_count:  questions.filter(q => q.revision_priority === 'DISTRICT_WORKSHOP').length,
      moderate_practice_count:  questions.filter(q => q.revision_priority === 'MODERATE_PRACTICE').length,
      on_track_count:           questions.filter(q => q.revision_priority === 'ON_TRACK').length,
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/state/teachers — Teacher performance matrix
// ─────────────────────────────────────────────────────────────────────────────
const getStateTeacherMatrix = asyncHandler(async (req, res) => {
  const mf = getMarksFilter(req.query);

  const { rows } = await pool.query(`
    SELECT
      u.id AS user_id, u.username, u.full_name, u.mobile,
      sc.school_name, sc.block_name, sc.district_name,
      COUNT(DISTINCT a.id)                                           AS total_assessments,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SUBMITTED')   AS submitted_assessments,
      ROUND(COALESCE(AVG(CASE WHEN sm.is_absent THEN 0
                              ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100
                         END), 0)::numeric, 1)                      AS avg_student_score
    FROM sd_users u
    LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id AND ta.is_active = true
    LEFT JOIN sd_schools sc ON sc.udise_code = COALESCE(ta.school_udise, u.primary_udise)
    LEFT JOIN sd_assessments a ON a.created_by = u.id
    LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
    LEFT JOIN sd_classes c ON c.id = a.class_id
    LEFT JOIN sd_subjects s ON s.id = sm.subject_id
    WHERE u.role = 'TEACHER' AND u.is_active = true
      ${mf.whereClause}
    GROUP BY u.id, u.username, u.full_name, u.mobile,
             sc.school_name, sc.block_name, sc.district_name
    ORDER BY avg_student_score DESC NULLS LAST, u.full_name ASC
    LIMIT 200
  `, mf.params);

  const teachers = rows.map(t => {
    const total      = Number(t.total_assessments || 0);
    const sub        = Number(t.submitted_assessments || 0);
    const compliance = total > 0 ? Math.round((sub / total) * 100) : 85;
    const avgScore   = Number(t.avg_student_score || 0);
    return {
      user_id:               t.user_id,
      username:              t.username,
      full_name:             t.full_name,
      mobile:                t.mobile,
      school_name:           t.school_name || 'Assigned School',
      block_name:            t.block_name  || 'N/A',
      district_name:         t.district_name || 'N/A',
      total_assessments:     total,
      submitted_assessments: sub,
      compliance_rate:       compliance,
      avg_student_score:     avgScore,
      rating: avgScore >= 80 ? 'Outstanding' : avgScore >= 70 ? 'Good' : avgScore >= 60 ? 'Average' : 'Training Required',
    };
  });

  res.json({ teachers, count: teachers.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/state/students — Comprehensive state-level student performance
// ─────────────────────────────────────────────────────────────────────────────
const getStateStudentPerformance = asyncHandler(async (req, res) => {
  const mf  = getMarksFilter(req.query);
  const stf = getStudentFilter(req.query);
  const sf  = getSchoolFilter(req.query);
  const { band, search } = req.query;

  // Band filter for student listing (a_plus, a, b, c, remedial)
  const bandFilters = {
    a_plus:   'pct >= 90',
    a:        'pct >= 75 AND pct < 90',
    b:        'pct >= 60 AND pct < 75',
    c:        'pct >= 40 AND pct < 60',
    remedial: 'pct < 40',
  };
  const bandWhere = band && band !== 'ALL' && bandFilters[band]
    ? ` AND ${bandFilters[band]}`
    : '';

  const searchWhere = search && search.trim() !== ''
    ? ` AND (st.student_name ILIKE $${mf.params.length + 1} OR sc.school_name ILIKE $${mf.params.length + 1} OR sc.district_name ILIKE $${mf.params.length + 1})`
    : '';
  const searchParams = search && search.trim() !== '' ? [...mf.params, `%${search.trim()}%`] : mf.params;

  // Run queries in two parallel batches to ensure smooth connection handling
  const [
    gradeDistRes,
    classWiseRes,
    subjectWiseRes,
    districtStudentRes,
    blockStudentRes,
  ] = await Promise.all([

    // 1. Grade distribution
    pool.query(`
      WITH sa AS (
        SELECT sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL ${mf.whereClause}
        GROUP BY sm.student_id
      )
      SELECT
        COUNT(*)                                        AS total_evaluated,
        ROUND(AVG(pct)::numeric, 1)                     AS avg_score,
        COUNT(*) FILTER (WHERE pct >= 90)               AS grade_a_plus,
        COUNT(*) FILTER (WHERE pct >= 75 AND pct < 90)  AS grade_a,
        COUNT(*) FILTER (WHERE pct >= 60 AND pct < 75)  AS grade_b,
        COUNT(*) FILTER (WHERE pct >= 40 AND pct < 60)  AS grade_c,
        COUNT(*) FILTER (WHERE pct < 40)                AS grade_remedial,
        COUNT(*) FILTER (WHERE pct >= 40)               AS total_pass,
        COUNT(*) FILTER (WHERE pct >= 75)               AS high_achievers,
        COUNT(*) FILTER (WHERE pct >= 90)               AS a_plus_count,
        ROUND(STDDEV(pct)::numeric, 1)                  AS score_stddev
      FROM sa
    `, mf.params),

    // 2. Class-wise performance (like principal's class performance)
    pool.query(`
      WITH ca AS (
        SELECT c.id AS class_id, c.class_name, c.class_num, sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL ${mf.whereClause}
        GROUP BY c.id, c.class_name, c.class_num, sm.student_id
      )
      SELECT
        class_id, class_name, class_num,
        COUNT(DISTINCT student_id)                               AS evaluated_students,
        ROUND(AVG(pct)::numeric, 1)                              AS avg_score_pct,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 40)      AS pass_students,
        COUNT(DISTINCT student_id) FILTER (WHERE pct < 40)       AS remedial_students,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 75)      AS high_achievers,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 90)      AS a_plus_students,
        ROUND(STDDEV(pct)::numeric, 1)                           AS score_stddev
      FROM ca
      GROUP BY class_id, class_name, class_num
      ORDER BY class_num ASC
    `, mf.params),

    // 3. Subject-wise performance (state-wide)
    pool.query(`
      WITH sa AS (
        SELECT s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
          sm.student_id,
          CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL ${mf.whereClause}
      )
      SELECT
        subject_id, subject_name, subject_code,
        COUNT(DISTINCT student_id)                        AS student_count,
        ROUND(AVG(pct)::numeric, 1)                       AS avg_score_pct,
        COUNT(*) FILTER (WHERE pct >= 40)                 AS pass_count,
        COUNT(*) FILTER (WHERE pct < 40)                  AS weak_students_count,
        COUNT(*) FILTER (WHERE pct >= 75)                 AS high_achievers_count,
        ROUND(MIN(pct)::numeric, 1)                       AS min_score,
        ROUND(MAX(pct)::numeric, 1)                       AS max_score
      FROM sa
      GROUP BY subject_id, subject_name, subject_code
      ORDER BY avg_score_pct DESC
    `, mf.params),

    // 4. District-wise student performance breakdown
    pool.query(`
      WITH da AS (
        SELECT sc.district_cd, sc.district_name, sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL ${mf.whereClause}
        GROUP BY sc.district_cd, sc.district_name, sm.student_id
      )
      SELECT
        district_cd, district_name,
        COUNT(DISTINCT student_id)                               AS evaluated_students,
        ROUND(AVG(pct)::numeric, 1)                              AS avg_score_pct,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 40)      AS pass_students,
        COUNT(DISTINCT student_id) FILTER (WHERE pct < 40)       AS remedial_students,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 75)      AS high_achievers,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 90)      AS a_plus_students
      FROM da
      GROUP BY district_cd, district_name
      ORDER BY avg_score_pct DESC
    `, mf.params),

    // 5. Block-wise student performance
    pool.query(`
      WITH ba AS (
        SELECT sc.block_cd, sc.block_name, sc.district_name, sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL ${mf.whereClause}
        GROUP BY sc.block_cd, sc.block_name, sc.district_name, sm.student_id
      )
      SELECT
        block_cd, block_name, district_name,
        COUNT(DISTINCT student_id)                               AS evaluated_students,
        ROUND(AVG(pct)::numeric, 1)                              AS avg_score_pct,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 40)      AS pass_students,
        COUNT(DISTINCT student_id) FILTER (WHERE pct < 40)       AS remedial_students,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 75)      AS high_achievers
      FROM ba
      GROUP BY block_cd, block_name, district_name
      ORDER BY avg_score_pct DESC
      LIMIT 50
    `, mf.params),
  ]);

  const [
    topStudentsRes,
    remedialStudentsRes,
    genderWiseRes,
    assessmentTrendRes,
    benchmarkMatrixRes,
    studentListRes,
  ] = await Promise.all([

    // 6. Top 20 students state-wide
    pool.query(`
      WITH sa AS (
        SELECT st.id AS student_id, st.student_name, st.gender, st.class_id,
          sc.school_name, sc.block_name, sc.district_name, c.class_name,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_students st ON st.id = sm.student_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL AND st.is_active = true ${mf.whereClause}
        GROUP BY st.id, st.student_name, st.gender, st.class_id, sc.school_name, sc.block_name, sc.district_name, c.class_name
      )
      SELECT * FROM sa
      ORDER BY pct DESC NULLS LAST
      LIMIT 20
    `, mf.params),

    // 7. Remedial students requiring attention (with school & district context)
    pool.query(`
      WITH sa AS (
        SELECT st.id AS student_id, st.student_name, st.gender,
          sc.school_name, sc.block_name, sc.district_name, c.class_name,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct,
          COUNT(DISTINCT sm.assessment_id) AS assessments_taken
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_students st ON st.id = sm.student_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL AND st.is_active = true ${mf.whereClause}
        GROUP BY st.id, st.student_name, st.gender, sc.school_name, sc.block_name, sc.district_name, c.class_name
        HAVING AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) < 40
      )
      SELECT * FROM sa ORDER BY pct ASC LIMIT 30
    `, mf.params),

    // 8. Gender-wise performance
    pool.query(`
      WITH sa AS (
        SELECT UPPER(st.gender) AS gender_norm, sm.student_id,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_students st ON st.id = sm.student_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL AND st.is_active = true ${mf.whereClause}
        GROUP BY UPPER(st.gender), sm.student_id
      )
      SELECT gender_norm,
        COUNT(DISTINCT student_id)                               AS student_count,
        ROUND(AVG(pct)::numeric, 1)                              AS avg_score,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 40)      AS pass_count,
        COUNT(DISTINCT student_id) FILTER (WHERE pct < 40)       AS remedial_count,
        COUNT(DISTINCT student_id) FILTER (WHERE pct >= 75)      AS high_achievers
      FROM sa
      GROUP BY gender_norm
    `, mf.params),

    // 9. Assessment-wise trend (student performance over time)
    pool.query(`
      SELECT
        a.id AS assessment_id,
        a.assessment_name,
        c.class_name,
        TO_CHAR(a.created_at, 'Mon YY') AS period,
        a.created_at,
        COUNT(DISTINCT sm.student_id)                            AS evaluated_students,
        ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END)::numeric, 1) AS avg_score_pct,
        COUNT(DISTINCT sm.student_id) FILTER (
          WHERE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 >= 40) AS pass_students,
        COUNT(DISTINCT sm.student_id) FILTER (
          WHERE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 < 40)  AS remedial_students
      FROM sd_assessments a
      JOIN sd_subject_marks sm ON sm.assessment_id = a.id
      JOIN sd_schools sc ON sc.udise_code = a.school_udise
      JOIN sd_classes c ON c.id = a.class_id
      JOIN sd_subjects s ON s.id = sm.subject_id
      WHERE sm.marks_obtained IS NOT NULL AND a.status = 'SUBMITTED' ${mf.whereClause}
      GROUP BY a.id, a.assessment_name, c.class_name, a.created_at
      ORDER BY a.created_at DESC
      LIMIT 20
    `, mf.params),

    // 10. Subject-Class benchmark matrix
    pool.query(`
      SELECT
        c.class_name, c.class_num,
        s.name AS subject_name, s.code AS subject_code,
        COUNT(DISTINCT sm.student_id)                            AS evaluated,
        ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END)::numeric, 1) AS avg_pct,
        COUNT(DISTINCT sm.student_id) FILTER (
          WHERE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 < 40) AS weak_count
      FROM sd_subject_marks sm
      JOIN sd_assessments a ON a.id = sm.assessment_id
      JOIN sd_schools sc ON sc.udise_code = a.school_udise
      JOIN sd_classes c ON c.id = a.class_id
      JOIN sd_subjects s ON s.id = sm.subject_id
      WHERE sm.marks_obtained IS NOT NULL ${mf.whereClause}
      GROUP BY c.class_name, c.class_num, s.name, s.code
      ORDER BY c.class_num ASC, avg_pct ASC
    `, mf.params),

    // 11. Student listing with pagination (first 200)
    pool.query(`
      WITH sa AS (
        SELECT st.id AS student_id, st.student_name, UPPER(st.gender) AS gender,
          c.class_name, sc.school_name, sc.block_name, sc.district_name,
          AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained / NULLIF(sm.max_marks, 0) * 100 END) AS pct,
          COUNT(DISTINCT sm.assessment_id) AS assessments_taken
        FROM sd_subject_marks sm
        JOIN sd_assessments a ON a.id = sm.assessment_id
        JOIN sd_students st ON st.id = sm.student_id
        JOIN sd_schools sc ON sc.udise_code = a.school_udise
        JOIN sd_classes c ON c.id = a.class_id
        JOIN sd_subjects s ON s.id = sm.subject_id
        WHERE sm.marks_obtained IS NOT NULL AND st.is_active = true ${mf.whereClause}
        GROUP BY st.id, st.student_name, st.gender, c.class_name, sc.school_name, sc.block_name, sc.district_name
      )
      SELECT * FROM sa
      WHERE 1=1 ${bandWhere}
      ORDER BY pct DESC NULLS LAST
      LIMIT 200
    `, searchParams),
  ]);

  // ── Parse results ─────────────────────────────────────────────────────────
  const grade = gradeDistRes.rows[0] || {};
  const totalEvaluated   = Number(grade.total_evaluated || 0);
  const avgScore         = Number(grade.avg_score || 0);
  const totalPass        = Number(grade.total_pass || 0);
  const passRate         = totalEvaluated > 0 ? Math.round((totalPass / totalEvaluated) * 100) : 0;
  const highAchievers    = Number(grade.high_achievers || 0);
  const highAchieversPct = totalEvaluated > 0 ? Math.round((highAchievers / totalEvaluated) * 100) : 0;
  const remedialTotal    = Number(grade.grade_remedial || 0);
  const remedialPct      = totalEvaluated > 0 ? Math.round((remedialTotal / totalEvaluated) * 100) : 0;

  // Gender analysis
  const genderMap = {};
  genderWiseRes.rows.forEach(g => {
    const key = ['M','MALE','BOY'].includes(g.gender_norm) ? 'male' : ['F','FEMALE','GIRL'].includes(g.gender_norm) ? 'female' : 'other';
    genderMap[key] = {
      count: Number(g.student_count || 0),
      avg_score: Number(g.avg_score || 0),
      pass_count: Number(g.pass_count || 0),
      remedial_count: Number(g.remedial_count || 0),
      high_achievers: Number(g.high_achievers || 0),
    };
  });

  // Class performance
  const classPerformance = classWiseRes.rows.map(c => {
    const ev  = Number(c.evaluated_students || 0);
    const pas = Number(c.pass_students || 0);
    const rem = Number(c.remedial_students || 0);
    const ha  = Number(c.high_achievers || 0);
    return {
      class_id:           c.class_id,
      class_name:         c.class_name,
      class_num:          Number(c.class_num),
      evaluated_students: ev,
      avg_score_pct:      Number(c.avg_score_pct || 0),
      pass_students:      pas,
      remedial_students:  rem,
      high_achievers:     ha,
      a_plus_students:    Number(c.a_plus_students || 0),
      pass_rate_pct:      ev > 0 ? Math.round((pas / ev) * 100) : 0,
      remedial_rate_pct:  ev > 0 ? Math.round((rem / ev) * 100) : 0,
      high_achiever_pct:  ev > 0 ? Math.round((ha / ev) * 100) : 0,
      score_stddev:       Number(c.score_stddev || 0),
    };
  });

  // Subject performance
  const subjectPerformance = subjectWiseRes.rows.map((s, idx) => {
    const sc  = Number(s.student_count || 0);
    const pc  = Number(s.pass_count || 0);
    const wc  = Number(s.weak_students_count || 0);
    return {
      rank:                 idx + 1,
      subject_id:          s.subject_id,
      subject_name:        s.subject_name,
      subject_code:        s.subject_code,
      student_count:       sc,
      avg_score_pct:       Number(s.avg_score_pct || 0),
      pass_count:          pc,
      weak_students_count: wc,
      high_achievers_count: Number(s.high_achievers_count || 0),
      pass_rate_pct:       sc > 0 ? Math.round((pc / sc) * 100) : 0,
      weak_pct:            sc > 0 ? Math.round((wc / sc) * 100) : 0,
      min_score:           Number(s.min_score || 0),
      max_score:           Number(s.max_score || 0),
      status:              Number(s.avg_score_pct || 0) >= 75 ? 'ON_TRACK' : Number(s.avg_score_pct || 0) >= 55 ? 'NEEDS_PRACTICE' : 'URGENT_WORKSHOP',
    };
  });

  // District student breakdown
  const districtBreakdown = districtStudentRes.rows.map((d, idx) => {
    const ev  = Number(d.evaluated_students || 0);
    const pas = Number(d.pass_students || 0);
    const rem = Number(d.remedial_students || 0);
    const ha  = Number(d.high_achievers || 0);
    const avg = Number(d.avg_score_pct || 0);
    return {
      rank:               idx + 1,
      district_cd:        d.district_cd,
      district_name:      d.district_name,
      evaluated_students: ev,
      avg_score_pct:      avg,
      pass_students:      pas,
      remedial_students:  rem,
      high_achievers:     ha,
      a_plus_students:    Number(d.a_plus_students || 0),
      pass_rate_pct:      ev > 0 ? Math.round((pas / ev) * 100) : 0,
      remedial_rate_pct:  ev > 0 ? Math.round((rem / ev) * 100) : 0,
      performance_tier:   avg >= 75 ? 'Excellent' : avg >= 65 ? 'Good' : avg >= 50 ? 'Average' : 'Needs Attention',
    };
  });

  // Block breakdown
  const blockBreakdown = blockStudentRes.rows.map((b, idx) => {
    const ev  = Number(b.evaluated_students || 0);
    const pas = Number(b.pass_students || 0);
    const rem = Number(b.remedial_students || 0);
    const avg = Number(b.avg_score_pct || 0);
    return {
      rank:               idx + 1,
      block_cd:           b.block_cd,
      block_name:         b.block_name,
      district_name:      b.district_name,
      evaluated_students: ev,
      avg_score_pct:      avg,
      pass_students:      pas,
      remedial_students:  rem,
      high_achievers:     Number(b.high_achievers || 0),
      pass_rate_pct:      ev > 0 ? Math.round((pas / ev) * 100) : 0,
      performance_tier:   avg >= 75 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 45 ? 'Average' : 'Needs Attention',
    };
  });

  // Top students
  const topStudents = topStudentsRes.rows.map((s, idx) => ({
    rank:          idx + 1,
    student_id:    s.student_id,
    student_name:  s.student_name,
    gender:        s.gender,
    class_name:    s.class_name,
    school_name:   s.school_name,
    block_name:    s.block_name,
    district_name: s.district_name,
    avg_score_pct: Math.round(Number(s.pct || 0) * 10) / 10,
    grade:         Number(s.pct) >= 90 ? 'A+' : Number(s.pct) >= 75 ? 'A' : Number(s.pct) >= 60 ? 'B' : Number(s.pct) >= 40 ? 'C' : 'Remedial',
  }));

  // Remedial students
  const remedialStudents = remedialStudentsRes.rows.map((s, idx) => ({
    rank:              idx + 1,
    student_id:        s.student_id,
    student_name:      s.student_name,
    gender:            s.gender,
    class_name:        s.class_name,
    school_name:       s.school_name,
    block_name:        s.block_name,
    district_name:     s.district_name,
    avg_score_pct:     Math.round(Number(s.pct || 0) * 10) / 10,
    assessments_taken: Number(s.assessments_taken || 0),
    intervention_level: Number(s.pct) < 20 ? 'CRITICAL' : Number(s.pct) < 30 ? 'HIGH' : 'MODERATE',
  }));

  // Assessment trend
  const assessmentTrend = assessmentTrendRes.rows.map(a => ({
    assessment_id:      a.assessment_id,
    assessment_name:    a.assessment_name,
    class_name:         a.class_name,
    period:             a.period,
    evaluated_students: Number(a.evaluated_students || 0),
    avg_score_pct:      Number(a.avg_score_pct || 0),
    pass_students:      Number(a.pass_students || 0),
    remedial_students:  Number(a.remedial_students || 0),
    pass_rate_pct:      Number(a.evaluated_students) > 0 ? Math.round((Number(a.pass_students) / Number(a.evaluated_students)) * 100) : 0,
  }));

  // Subject-Class benchmark matrix
  const benchmarkMatrix = benchmarkMatrixRes.rows.map(r => ({
    class_name:   r.class_name,
    class_num:    Number(r.class_num),
    subject_name: r.subject_name,
    subject_code: r.subject_code,
    evaluated:    Number(r.evaluated || 0),
    avg_pct:      Number(r.avg_pct || 0),
    weak_count:   Number(r.weak_count || 0),
    status:       Number(r.avg_pct) >= 70 ? 'good' : Number(r.avg_pct) >= 50 ? 'warning' : 'danger',
  }));

  // Student listing
  const students = studentListRes.rows.map((s, idx) => ({
    rank:              idx + 1,
    student_id:        s.student_id,
    student_name:      s.student_name,
    gender:            s.gender,
    class_name:        s.class_name,
    school_name:       s.school_name,
    block_name:        s.block_name,
    district_name:     s.district_name,
    avg_score_pct:     Math.round(Number(s.pct || 0) * 10) / 10,
    assessments_taken: Number(s.assessments_taken || 0),
    grade:             Number(s.pct) >= 90 ? 'A+' : Number(s.pct) >= 75 ? 'A' : Number(s.pct) >= 60 ? 'B' : Number(s.pct) >= 40 ? 'C' : 'Remedial',
    performance_band:  Number(s.pct) >= 90 ? 'a_plus' : Number(s.pct) >= 75 ? 'a' : Number(s.pct) >= 60 ? 'b' : Number(s.pct) >= 40 ? 'c' : 'remedial',
  }));

  res.json({
    kpis: {
      total_evaluated: totalEvaluated,
      avg_score:       avgScore,
      pass_rate_pct:   passRate,
      high_achievers:  highAchievers,
      high_achiever_pct: highAchieversPct,
      remedial_count:  remedialTotal,
      remedial_pct:    remedialPct,
      a_plus_count:    Number(grade.a_plus_count || 0),
      score_stddev:    Number(grade.score_stddev || 0),
    },
    grade_distribution: {
      a_plus:   Number(grade.grade_a_plus || 0),
      a:        Number(grade.grade_a || 0),
      b:        Number(grade.grade_b || 0),
      c:        Number(grade.grade_c || 0),
      remedial: Number(grade.grade_remedial || 0),
    },
    gender_analysis: genderMap,
    class_performance: classPerformance,
    subject_performance: subjectPerformance,
    district_breakdown:  districtBreakdown,
    block_breakdown:     blockBreakdown,
    top_students:        topStudents,
    remedial_students:   remedialStudents,
    assessment_trend:    assessmentTrend,
    benchmark_matrix:    benchmarkMatrix,
    students,
    student_count:       students.length,
  });
});

module.exports = {
  getStateOverview,
  getStateDistricts,
  getStateQuestionAnalytics,
  getStateTeacherMatrix,
  getStateStudentPerformance,
};
