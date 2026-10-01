const pool = require('../config/db');

/**
 * Helper to get the effective school UDISE for a principal/admin request
 */
function getTargetUdise(req) {
  const user = req.user;
  if (user.role === 'SCHOOL_ADMIN' || user.role === 'TEACHER') {
    return user.primary_udise;
  }
  // If state admin or super admin, allow passing udise in query
  return req.query.udise || user.primary_udise || '22050904705';
}

/**
 * GET /api/principal/overview
 * Comprehensive School KPI overview, Class-wise averages, and Subject distributions
 */
async function getSchoolOverview(req, res) {
  const udise = getTargetUdise(req);
  if (!udise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  // 1. School Master Details
  const schoolRes = await pool.query(
    `SELECT udise_code, school_name, cluster_name, block_name, district_name, hos_name, hos_mobile
     FROM sd_schools WHERE udise_code = $1`,
    [udise]
  );
  if (!schoolRes.rowCount) {
    return res.status(404).json({ error: 'School not found' });
  }
  const school = schoolRes.rows[0];

  // 2. Total Teachers in School
  const teacherRes = await pool.query(
    `SELECT COUNT(DISTINCT u.id) as teacher_count
     FROM sd_users u
     LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id
     WHERE u.role = 'TEACHER' AND (u.primary_udise = $1 OR ta.school_udise = $1)`,
    [udise]
  );
  const teacherCount = Number(teacherRes.rows[0].teacher_count || 0);

  // 3. Total Students in School
  const studentRes = await pool.query(
    `SELECT COUNT(*) as student_count,
            COUNT(*) FILTER (WHERE gender = 'M') as male_count,
            COUNT(*) FILTER (WHERE gender = 'F') as female_count
     FROM sd_students
     WHERE school_udise = $1 AND is_active = true`,
    [udise]
  );
  const studentStats = studentRes.rows[0];
  const totalStudents = Number(studentStats.student_count || 0);

  // 4. Assessments Stats
  const asmtRes = await pool.query(
    `SELECT 
       COUNT(*) as total_assessments,
       COUNT(*) FILTER (WHERE status = 'SUBMITTED') as submitted_assessments,
       COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_assessments
     FROM sd_assessments
     WHERE school_udise = $1`,
    [udise]
  );
  const asmtStats = asmtRes.rows[0];

  // 5. Overall Marks Aggregation & Grade Distribution
  const marksRes = await pool.query(
    `WITH student_averages AS (
      SELECT 
        sm.student_id,
        st.class_id,
        c.class_name,
        c.class_num,
        AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END) as student_pct
      FROM sd_subject_marks sm
      JOIN sd_assessments a ON a.id = sm.assessment_id
      JOIN sd_students st ON st.id = sm.student_id
      JOIN sd_classes c ON c.id = st.class_id
      WHERE a.school_udise = $1 AND sm.marks_obtained IS NOT NULL
      GROUP BY sm.student_id, st.class_id, c.class_name, c.class_num
    )
    SELECT 
      ROUND(AVG(student_pct), 1) as overall_avg_pct,
      COUNT(*) FILTER (WHERE student_pct >= 40) as passed_students,
      COUNT(*) as total_evaluated_students,
      COUNT(*) FILTER (WHERE student_pct >= 90) as grade_a_plus,
      COUNT(*) FILTER (WHERE student_pct >= 75 AND student_pct < 90) as grade_a,
      COUNT(*) FILTER (WHERE student_pct >= 60 AND student_pct < 75) as grade_b,
      COUNT(*) FILTER (WHERE student_pct >= 40 AND student_pct < 60) as grade_c,
      COUNT(*) FILTER (WHERE student_pct < 40) as grade_remedial
    FROM student_averages`,
    [udise]
  );
  const gradeData = marksRes.rows[0] || {};
  const totalEvaluated = Number(gradeData.total_evaluated_students || 0);
  const passedStudents = Number(gradeData.passed_students || 0);
  const overallAvg = Number(gradeData.overall_avg_pct || 0);
  const passRate = totalEvaluated > 0 ? Math.round((passedStudents / totalEvaluated) * 1000) / 10 : 0;
  const remedialCount = Number(gradeData.grade_remedial || 0);

  // 6. Class-wise Performance Matrix
  const classPerfRes = await pool.query(
    `SELECT 
       c.id as class_id,
       c.class_name,
       c.class_num,
       COUNT(DISTINCT st.id) as enrolled_count,
       COUNT(DISTINCT sm.student_id) as evaluated_count,
       ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_score_pct,
       COUNT(DISTINCT sm.student_id) FILTER (WHERE sm.marks_obtained / NULLIF(sm.max_marks, 0) >= 0.4) as pass_count,
       COUNT(DISTINCT sm.student_id) FILTER (WHERE sm.marks_obtained / NULLIF(sm.max_marks, 0) < 0.4) as remedial_count
     FROM sd_classes c
     LEFT JOIN sd_students st ON st.class_id = c.id AND st.school_udise = $1 AND st.is_active = true
     LEFT JOIN sd_assessments a ON a.class_id = c.id AND a.school_udise = $1
     LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id AND sm.student_id = st.id AND sm.marks_obtained IS NOT NULL
     WHERE c.class_num BETWEEN 1 AND 10
     GROUP BY c.id, c.class_name, c.class_num
     HAVING COUNT(DISTINCT st.id) > 0
     ORDER BY c.class_num`,
    [udise]
  );

  // 7. Subject-wise Average Performance across School
  const subjectPerfRes = await pool.query(
    `SELECT 
       s.id as subject_id,
       s.name as subject_name,
       s.code as subject_code,
       ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_score_pct,
       COUNT(DISTINCT sm.student_id) as student_count,
       COUNT(DISTINCT sm.student_id) FILTER (WHERE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) < 0.4) as weak_students_count
     FROM sd_subjects s
     JOIN sd_subject_marks sm ON sm.subject_id = s.id
     JOIN sd_assessments a ON a.id = sm.assessment_id
     WHERE a.school_udise = $1 AND sm.marks_obtained IS NOT NULL
     GROUP BY s.id, s.name, s.code
     ORDER BY avg_score_pct DESC`,
    [udise]
  );

  return res.json({
    school,
    kpis: {
      total_teachers: teacherCount,
      total_students: totalStudents,
      male_students: Number(studentStats.male_count || 0),
      female_students: Number(studentStats.female_count || 0),
      total_assessments: Number(asmtStats.total_assessments || 0),
      submitted_assessments: Number(asmtStats.submitted_assessments || 0),
      draft_assessments: Number(asmtStats.draft_assessments || 0),
      overall_avg_pct: overallAvg,
      pass_rate_pct: passRate,
      remedial_count: remedialCount,
    },
    grade_distribution: {
      a_plus: Number(gradeData.grade_a_plus || 0),
      a: Number(gradeData.grade_a || 0),
      b: Number(gradeData.grade_b || 0),
      c: Number(gradeData.grade_c || 0),
      remedial: Number(gradeData.grade_remedial || 0),
    },
    class_performance: classPerfRes.rows.map(r => ({
      class_id: r.class_id,
      class_name: r.class_name,
      class_num: r.class_num,
      enrolled_count: Number(r.enrolled_count || 0),
      evaluated_count: Number(r.evaluated_count || 0),
      avg_score_pct: Number(r.avg_score_pct || 0),
      remedial_count: Number(r.remedial_count || 0),
    })),
    subject_performance: subjectPerfRes.rows.map(r => ({
      subject_id: r.subject_id,
      subject_name: r.subject_name,
      subject_code: r.subject_code,
      avg_score_pct: Number(r.avg_score_pct || 0),
      student_count: Number(r.student_count || 0),
      weak_students_count: Number(r.weak_students_count || 0),
    })),
  });
}

/**
 * GET /api/principal/teachers
 * Teacher Roster, Assigned Classes, Assessments Conducted & Submission Compliance
 */
async function getTeacherPerformance(req, res) {
  const udise = getTargetUdise(req);
  if (!udise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  const result = await pool.query(
    `SELECT 
       u.id as user_id,
       u.username,
       u.full_name,
       u.email,
       u.mobile,
       u.role,
       u.last_login_at,
       COALESCE(
         JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('class_id', c.id, 'class_name', c.class_name, 'class_num', c.class_num))
         FILTER (WHERE c.id IS NOT NULL), '[]'
       ) as assigned_classes,
       COUNT(DISTINCT a.id) as total_assessments,
       COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'SUBMITTED') as submitted_assessments,
       COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'DRAFT') as pending_assessments,
       ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_student_score
     FROM sd_users u
     LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id AND ta.school_udise = $1 AND ta.is_active = true
     LEFT JOIN sd_classes c ON c.id = ta.class_id
     LEFT JOIN sd_assessments a ON a.created_by = u.id AND a.school_udise = $1
     LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
     WHERE u.role = 'TEACHER' AND (u.primary_udise = $1 OR ta.school_udise = $1)
     GROUP BY u.id, u.username, u.full_name, u.email, u.mobile, u.role, u.last_login_at
     ORDER BY u.full_name ASC`,
    [udise]
  );

  const teachers = result.rows.map(t => {
    const total = Number(t.total_assessments || 0);
    const sub = Number(t.submitted_assessments || 0);
    const complianceRate = total > 0 ? Math.round((sub / total) * 100) : 100;
    return {
      id: t.user_id,
      username: t.username,
      full_name: t.full_name,
      email: t.email,
      mobile: t.mobile,
      role: t.role,
      last_login_at: t.last_login_at,
      assigned_classes: t.assigned_classes || [],
      total_assessments: total,
      submitted_assessments: sub,
      pending_assessments: Number(t.pending_assessments || 0),
      avg_student_score: Number(t.avg_student_score || 0),
      compliance_rate: complianceRate,
      status: complianceRate >= 80 ? 'EXCELLENT' : complianceRate >= 50 ? 'IN_PROGRESS' : 'ACTION_REQUIRED',
    };
  });

  return res.json({ teachers, count: teachers.length });
}

/**
 * GET /api/principal/students
 * Student Directory with Performance Banding, Weak Subjects, and Remedial Flags
 */
async function getStudentDirectory(req, res) {
  const udise = getTargetUdise(req);
  if (!udise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  const { class_id, band, search } = req.query;
  const whereClauses = ['st.school_udise = $1', 'st.is_active = true'];
  const params = [udise];

  if (class_id && class_id !== 'ALL') {
    params.push(class_id);
    whereClauses.push(`st.class_id = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClauses.push(`(st.student_name ILIKE $${params.length} OR st.roll_number::text = $${params.length})`);
  }

  const query = `
    WITH student_marks_summary AS (
      SELECT 
        sm.student_id,
        COUNT(sm.id) as total_tests_taken,
        ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_pct,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) < 0.4) as weak_subjects,
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'assessment_name', a.assessment_name,
              'subject', s.name,
              'marks', sm.marks_obtained,
              'max_marks', sm.max_marks,
              'is_absent', sm.is_absent
            )
          ) FILTER (WHERE a.assessment_name IS NOT NULL), '[]'
        ) as exam_details
      FROM sd_subject_marks sm
      JOIN sd_subjects s ON s.id = sm.subject_id
      JOIN sd_assessments a ON a.id = sm.assessment_id
      WHERE a.school_udise = $1 AND sm.marks_obtained IS NOT NULL
      GROUP BY sm.student_id
    )
    SELECT 
      st.id,
      st.roll_number,
      st.student_name,
      st.gender,
      st.dob,
      st.guardian_name,
      st.class_id,
      c.class_name,
      c.class_num,
      COALESCE(sms.avg_pct, 0) as avg_pct,
      COALESCE(sms.total_tests_taken, 0) as total_tests_taken,
      COALESCE(sms.weak_subjects, '{}') as weak_subjects,
      COALESCE(sms.exam_details, '[]') as exam_details
    FROM sd_students st
    JOIN sd_classes c ON c.id = st.class_id
    LEFT JOIN student_marks_summary sms ON sms.student_id = st.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY c.class_num ASC, st.roll_number ASC`;

  const result = await pool.query(query, params);

  let students = result.rows.map(s => {
    const pct = Number(s.avg_pct || 0);
    let bandCategory = 'AVERAGE';
    let bandLabel = 'Average Performer';
    let badgeColor = '#0284c7';

    if (pct >= 80) {
      bandCategory = 'TOP';
      bandLabel = 'Star Performer';
      badgeColor = '#10b981';
    } else if (pct >= 60) {
      bandCategory = 'GOOD';
      bandLabel = 'Consistent';
      badgeColor = '#0284c7';
    } else if (pct >= 40) {
      bandCategory = 'NEEDS_GUIDANCE';
      bandLabel = 'Needs Guidance';
      badgeColor = '#f59e0b';
    } else if (s.total_tests_taken > 0) {
      bandCategory = 'AT_RISK';
      bandLabel = 'Critical Remedial (<40%)';
      badgeColor = '#ef4444';
    } else {
      bandCategory = 'UNTESTED';
      bandLabel = 'No Assessment Yet';
      badgeColor = '#64748b';
    }

    return {
      id: s.id,
      roll_number: s.roll_number,
      student_name: s.student_name,
      gender: s.gender,
      dob: s.dob,
      guardian_name: s.guardian_name,
      class_id: s.class_id,
      class_name: s.class_name,
      class_num: s.class_num,
      avg_pct: pct,
      total_tests_taken: Number(s.total_tests_taken),
      weak_subjects: s.weak_subjects || [],
      exam_details: s.exam_details || [],
      band: bandCategory,
      band_label: bandLabel,
      badge_color: badgeColor,
    };
  });

  if (band && band !== 'ALL') {
    students = students.filter(s => s.band === band);
  }

  return res.json({
    students,
    total: students.length,
    counts: {
      top: students.filter(s => s.band === 'TOP').length,
      at_risk: students.filter(s => s.band === 'AT_RISK').length,
    }
  });
}

/**
 * GET /api/principal/exams
 * Comprehensive Exam Breakdown (FA-1, Mid-Term, Unit Tests) across all classes
 */
async function getSchoolExams(req, res) {
  const udise = getTargetUdise(req);
  if (!udise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  const query = `
    WITH exam_subject_averages AS (
      SELECT 
        sm.assessment_id,
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_marks
      FROM sd_subject_marks sm
      JOIN sd_subjects s ON s.id = sm.subject_id
      JOIN sd_assessments a ON a.id = sm.assessment_id
      WHERE a.school_udise = $1 AND sm.marks_obtained IS NOT NULL
      GROUP BY sm.assessment_id, s.id, s.name, s.code
    ),
    exam_subject_aggregated AS (
      SELECT 
        assessment_id,
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'subject_name', subject_name,
            'subject_code', subject_code,
            'avg_marks', avg_marks
          )
        ) as subject_breakdown
      FROM exam_subject_averages
      GROUP BY assessment_id
    ),
    exam_base_stats AS (
      SELECT 
        a.id as assessment_id,
        a.assessment_name,
        a.assessment_type,
        a.status,
        a.total_students,
        a.students_entered,
        a.created_at,
        a.submitted_at,
        c.id as class_id,
        c.class_name,
        c.class_num,
        u.full_name as teacher_name,
        ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_score_pct,
        COUNT(DISTINCT sm.student_id) as evaluated_students,
        COUNT(DISTINCT sm.student_id) FILTER (WHERE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) >= 0.4) as pass_students,
        COUNT(DISTINCT sm.student_id) FILTER (WHERE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) < 0.4) as remedial_students
      FROM sd_assessments a
      JOIN sd_classes c ON c.id = a.class_id
      LEFT JOIN sd_users u ON u.id = a.created_by
      LEFT JOIN sd_subject_marks sm ON sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
      WHERE a.school_udise = $1
      GROUP BY a.id, a.assessment_name, a.assessment_type, a.status, a.total_students, a.students_entered, a.created_at, a.submitted_at, c.id, c.class_name, c.class_num, u.full_name
    )
    SELECT 
      ebs.*,
      COALESCE(esa.subject_breakdown, '[]'::jsonb) as subject_breakdown
    FROM exam_base_stats ebs
    LEFT JOIN exam_subject_aggregated esa ON esa.assessment_id = ebs.assessment_id
    ORDER BY ebs.class_num ASC, ebs.created_at DESC`;

  const result = await pool.query(query, [udise]);

  return res.json({
    exams: result.rows.map(r => ({
      assessment_id: r.assessment_id,
      assessment_name: r.assessment_name,
      assessment_type: r.assessment_type,
      status: r.status,
      total_students: Number(r.total_students || 0),
      students_entered: Number(r.students_entered || 0),
      class_id: r.class_id,
      class_name: r.class_name,
      class_num: r.class_num,
      teacher_name: r.teacher_name || 'Assigned Teacher',
      avg_score_pct: Number(r.avg_score_pct || 0),
      evaluated_students: Number(r.evaluated_students || 0),
      pass_students: Number(r.pass_students || 0),
      remedial_students: Number(r.remedial_students || 0),
      subject_breakdown: r.subject_breakdown || [],
      submitted_at: r.submitted_at,
    })),
    count: result.rowCount
  });
}

/**
 * GET /api/principal/learning-outcomes
 * School Question-Wise Marks & Report Card Performance Diagnostics
 */
async function getSchoolLearningOutcomes(req, res) {
  const udise = getTargetUdise(req);
  if (!udise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  const result = await pool.query(
    `SELECT 
       qm.question_id,
       q.question_number,
       q.max_marks,
       s.id as subject_id,
       s.name as subject_name,
       s.code as subject_code,
       c.id as class_id,
       c.class_name,
       c.class_num,
       a.id as assessment_id,
       a.assessment_name,
       a.assessment_type,
       COUNT(DISTINCT qm.student_id) as students_tested,
       COALESCE(ROUND(AVG(CASE WHEN qm.is_absent = false AND qm.marks_obtained IS NOT NULL 
                               THEN (qm.marks_obtained::numeric / NULLIF(qm.max_marks, 0)) * 100 
                               ELSE NULL END), 1), 60.0) as avg_score_pct,
       COALESCE(ROUND(AVG(CASE WHEN qm.is_absent = false AND qm.marks_obtained IS NOT NULL 
                               THEN qm.marks_obtained::numeric 
                               ELSE NULL END), 1), 0.0) as avg_marks_obtained,
       COUNT(CASE WHEN qm.is_absent = false AND qm.marks_obtained IS NOT NULL 
                       AND (qm.marks_obtained::numeric / NULLIF(qm.max_marks, 0)) < 0.4 THEN 1 END) as weak_students_count
     FROM sd_question_marks qm
     JOIN sd_questions q ON q.id = qm.question_id
     JOIN sd_subjects s ON s.id = qm.subject_id
     JOIN sd_assessments a ON a.id = qm.assessment_id
     JOIN sd_classes c ON c.id = a.class_id
     WHERE a.school_udise = $1
     GROUP BY qm.question_id, q.question_number, q.max_marks, s.id, s.name, s.code, c.id, c.class_name, c.class_num, a.id, a.assessment_name, a.assessment_type
     ORDER BY c.class_num ASC, s.name ASC, q.question_number ASC`,
    [udise]
  );

  const formattedLOs = result.rows.map(r => {
    const avgPct = Number(r.avg_score_pct || 60);
    const avgMarks = Number(r.avg_marks_obtained || 0);
    const maxMarks = Number(r.max_marks || 10);
    const weakCount = Number(r.weak_students_count || 0);
    const qNum = r.question_number || 'Q01';

    let revisionPriority = 'MASTERED';
    let directive = `प्रश्न ${qNum} पर छात्रों की समझ संतोषजनक (${avgPct}%) है।`;

    if (avgPct < 55 || weakCount >= 5) {
      revisionPriority = 'URGENT_REVISION';
      directive = `${r.class_name} ${r.subject_name} • प्रश्न ${qNum} पर कक्षा औसत मात्र ${avgPct}% (${weakCount} छात्रों के प्राप्तांक 40% से कम)। शिक्षक को इस प्रश्न के हल पर विशेष पुनरावृत्ति (Revision) कराने का निर्देश।`;
    } else if (avgPct < 72 || weakCount >= 2) {
      revisionPriority = 'MODERATE_PRACTICE';
      directive = `कक्षा कार्य एवं अभ्यास पत्रक (Worksheets) के माध्यम से प्रश्न ${qNum} का अतिरिक्त अभ्यास कराएं।`;
    }

    return {
      lo_id: r.question_id,
      question_id: r.question_id,
      lo_code: `Q-${r.subject_code}-${qNum}`,
      question_number: qNum,
      description: `Question ${qNum} (${maxMarks} Marks) • ${r.assessment_name}`,
      assessment_id: r.assessment_id,
      assessment_name: r.assessment_name,
      assessment_type: r.assessment_type,
      subject_id: r.subject_id,
      subject_name: r.subject_name,
      subject_code: r.subject_code,
      class_id: r.class_id,
      class_name: r.class_name,
      class_num: r.class_num,
      max_marks: maxMarks,
      avg_marks_obtained: avgMarks,
      mastery_pct: avgPct,
      avg_score_pct: avgPct,
      students_tested: Number(r.students_tested || 25),
      weak_students_count: weakCount,
      weakest_question: qNum,
      revision_priority: revisionPriority,
      teacher_directive: directive,
      status: avgPct >= 75 ? 'MASTERED' : avgPct >= 55 ? 'DEVELOPING' : 'NEEDS_INTERVENTION',
    };
  });

  return res.json({
    learning_outcomes: formattedLOs,
    summary: {
      total_questions: formattedLOs.length,
      urgent_revision_count: formattedLOs.filter(l => l.revision_priority === 'URGENT_REVISION').length,
      moderate_practice_count: formattedLOs.filter(l => l.revision_priority === 'MODERATE_PRACTICE').length,
      mastered_count: formattedLOs.filter(l => l.revision_priority === 'MASTERED').length,
    }
  });
}

/**
 * GET /api/principal/subject-benchmark
 * Class & Subject Performance Threshold / Relative Mean Benchmark Analyzer
 * Automatically determines Class Subject Average (e.g. 75%) and segregates students into Above & Below cohorts
 */
async function getSubjectClassBenchmark(req, res) {
  const udise = getTargetUdise(req);
  if (!udise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  const { class_id, subject_id, assessment_id, custom_benchmark } = req.query;

  // 1. Fetch school details
  const schoolRes = await pool.query(
    `SELECT udise_code, school_name, cluster_name, block_name, district_name, hos_name
     FROM sd_schools WHERE udise_code = $1`,
    [udise]
  );
  const school = schoolRes.rows[0] || {};

  // 2. Fetch all available classes with evaluations in this school
  const classesRes = await pool.query(
    `SELECT DISTINCT c.id, c.class_name, c.class_num, COUNT(DISTINCT sm.student_id) as evaluated_students
     FROM sd_classes c
     JOIN sd_assessments a ON a.class_id = c.id
     JOIN sd_subject_marks sm ON sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
     WHERE a.school_udise = $1
     GROUP BY c.id, c.class_name, c.class_num
     ORDER BY c.class_num ASC`,
    [udise]
  );
  const classes = classesRes.rows;
  if (classes.length === 0) {
    return res.json({
      school,
      classes: [],
      subjects: [],
      assessments: [],
      benchmark_stats: null,
      above_benchmark_students: [],
      below_benchmark_students: [],
    });
  }

  // Active Class (default to provided class_id or first available)
  const activeClassId = class_id && classes.some(c => String(c.id) === String(class_id))
    ? class_id
    : classes[0].id;
  const activeClass = classes.find(c => String(c.id) === String(activeClassId));

  // 3. Fetch all available subjects for this class
  const subjectsRes = await pool.query(
    `SELECT DISTINCT s.id, s.name, s.code,
            ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_score_pct,
            COUNT(DISTINCT sm.student_id) as student_count
     FROM sd_subjects s
     JOIN sd_subject_marks sm ON sm.subject_id = s.id AND sm.marks_obtained IS NOT NULL
     JOIN sd_assessments a ON a.id = sm.assessment_id
     WHERE a.school_udise = $1 AND a.class_id = $2
     GROUP BY s.id, s.name, s.code
     ORDER BY s.name ASC`,
    [udise, activeClassId]
  );
  const subjects = subjectsRes.rows;

  // Active Subject (default to provided subject_id or first available)
  const activeSubjectId = subject_id && subjects.some(s => String(s.id) === String(subject_id))
    ? subject_id
    : (subjects[0] ? subjects[0].id : null);
  const activeSubject = subjects.find(s => String(s.id) === String(activeSubjectId)) || {};

  // 4. Fetch assessments for this class & subject
  const assessmentsRes = await pool.query(
    `SELECT DISTINCT a.id, a.assessment_name, a.assessment_type, a.status, a.created_at
     FROM sd_assessments a
     JOIN sd_subject_marks sm ON sm.assessment_id = a.id
     WHERE a.school_udise = $1 AND a.class_id = $2 ${activeSubjectId ? 'AND sm.subject_id = $3' : ''}
     ORDER BY a.created_at DESC`,
    activeSubjectId ? [udise, activeClassId, activeSubjectId] : [udise, activeClassId]
  );
  const assessments = assessmentsRes.rows;

  if (!activeSubjectId) {
    return res.json({
      school,
      classes,
      subjects,
      assessments,
      selected_class: activeClass,
      selected_subject: null,
      benchmark_stats: null,
      above_benchmark_students: [],
      below_benchmark_students: [],
    });
  }

  // 5. Query student marks for active class and subject
  const assessmentFilter = assessment_id && assessment_id !== 'ALL'
    ? 'AND a.id = $4'
    : '';
  const queryParams = [udise, activeClassId, activeSubjectId];
  if (assessment_id && assessment_id !== 'ALL') queryParams.push(assessment_id);

  const studentMarksRes = await pool.query(
    `SELECT 
       st.id as student_id,
       st.roll_number,
       st.student_name,
       st.gender,
       st.guardian_name,
       c.class_name,
       c.class_num,
       s.name as subject_name,
       s.code as subject_code,
       ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE (sm.marks_obtained / NULLIF(sm.max_marks, 0)) * 100 END), 1) as avg_score_pct,
       ROUND(AVG(CASE WHEN sm.is_absent THEN 0 ELSE sm.marks_obtained END), 1) as avg_marks_obtained,
       ROUND(AVG(sm.max_marks), 0) as max_marks,
       COUNT(sm.id) as tests_count,
       BOOL_OR(sm.is_absent) as had_absence
     FROM sd_students st
     JOIN sd_classes c ON c.id = st.class_id
     JOIN sd_subject_marks sm ON sm.student_id = st.id AND sm.marks_obtained IS NOT NULL
     JOIN sd_subjects s ON s.id = sm.subject_id
     JOIN sd_assessments a ON a.id = sm.assessment_id
     WHERE a.school_udise = $1 AND c.id = $2 AND s.id = $3 ${assessmentFilter}
     GROUP BY st.id, st.roll_number, st.student_name, st.gender, st.guardian_name, c.class_name, c.class_num, s.name, s.code
     ORDER BY avg_score_pct DESC, st.roll_number ASC`,
    queryParams
  );

  const studentList = studentMarksRes.rows;
  const totalTested = studentList.length;

  if (totalTested === 0) {
    return res.json({
      school,
      classes,
      subjects,
      assessments,
      selected_class: activeClass,
      selected_subject: activeSubject,
      selected_assessment: assessments.find(a => String(a.id) === String(assessment_id)) || null,
      benchmark_stats: {
        class_subject_avg_pct: 0,
        benchmark_used_pct: custom_benchmark ? Number(custom_benchmark) : 0,
        total_students_tested: 0,
        above_count: 0,
        below_count: 0,
        highest_score_pct: 0,
        lowest_score_pct: 0,
      },
      above_benchmark_students: [],
      below_benchmark_students: [],
    });
  }

  // Calculate Class Subject Mean Average
  const calculatedMean = Number((studentList.reduce((acc, s) => acc + Number(s.avg_score_pct), 0) / totalTested).toFixed(1));
  const benchmarkThreshold = custom_benchmark && !isNaN(Number(custom_benchmark))
    ? Number(custom_benchmark)
    : calculatedMean;

  // Segregate Students
  const aboveList = [];
  const belowList = [];

  studentList.forEach((s, idx) => {
    const score = Number(s.avg_score_pct || 0);
    const delta = Number((score - benchmarkThreshold).toFixed(1));
    const isAbove = score >= benchmarkThreshold;

    let performanceBand = 'AVERAGE';
    let actionRecommendation = '';
    let priorityLevel = 'ON_TRACK';

    if (score >= 90) {
      performanceBand = 'OUTSTANDING_STAR';
      actionRecommendation = 'Peer Mentor · Advanced Olympiad Practice';
      priorityLevel = 'TOP_HONORS';
    } else if (score >= 75) {
      performanceBand = 'ABOVE_AVERAGE';
      actionRecommendation = 'Enrichment Assignments · Complex Problem Solving';
      priorityLevel = 'OPTIMAL';
    } else if (score >= 60) {
      performanceBand = 'AVERAGE_CONSISTENT';
      actionRecommendation = 'Targeted Practice on Numerical & Word Problems';
      priorityLevel = 'MODERATE';
    } else if (score >= 40) {
      performanceBand = 'NEEDS_GUIDANCE';
      actionRecommendation = 'Weekly Practice Worksheets · Guided Concept Revision';
      priorityLevel = 'HIGH_ATTENTION';
    } else {
      performanceBand = 'CRITICAL_REMEDIAL';
      actionRecommendation = 'Remedial Bridge Class · 1-on-1 Teacher Support';
      priorityLevel = 'CRITICAL';
    }

    const studentRecord = {
      student_id: s.student_id,
      roll_number: s.roll_number,
      student_name: (s.student_name || '').trim(),
      gender: s.gender,
      guardian_name: s.guardian_name,
      marks_obtained: Number(s.avg_marks_obtained || 0),
      max_marks: Number(s.max_marks || 100),
      score_pct: score,
      delta_pct: delta,
      is_above_benchmark: isAbove,
      performance_band: performanceBand,
      priority_level: priorityLevel,
      action_recommendation: actionRecommendation,
      tests_count: Number(s.tests_count || 1),
      had_absence: s.had_absence,
      rank: idx + 1,
    };

    if (isAbove) {
      aboveList.push(studentRecord);
    } else {
      belowList.push(studentRecord);
    }
  });

  // Score distribution bins
  const bins = [
    { range: '≥90%', label: 'Star Performers (≥90%)', count: studentList.filter(s => s.avg_score_pct >= 90).length, color: '#10b981' },
    { range: '75-89%', label: 'Above Average (75-89%)', count: studentList.filter(s => s.avg_score_pct >= 75 && s.avg_score_pct < 90).length, color: '#0284c7' },
    { range: '60-74%', label: 'Average (60-74%)', count: studentList.filter(s => s.avg_score_pct >= 60 && s.avg_score_pct < 75).length, color: '#6366f1' },
    { range: '40-59%', label: 'Needs Guidance (40-59%)', count: studentList.filter(s => s.avg_score_pct >= 40 && s.avg_score_pct < 60).length, color: '#f59e0b' },
    { range: '<40%', label: 'Critical Remedial (<40%)', count: studentList.filter(s => s.avg_score_pct < 40).length, color: '#ef4444' },
  ];

  const highestStudent = studentList[0];
  const lowestStudent = studentList[studentList.length - 1];
  const passCount = studentList.filter(s => s.avg_score_pct >= 40).length;

  return res.json({
    school,
    classes,
    subjects,
    assessments,
    selected_class: activeClass,
    selected_subject: activeSubject,
    selected_assessment: assessments.find(a => String(a.id) === String(assessment_id)) || null,
    benchmark_stats: {
      class_subject_avg_pct: calculatedMean,
      benchmark_used_pct: benchmarkThreshold,
      is_custom_benchmark: !!(custom_benchmark && Number(custom_benchmark) !== calculatedMean),
      total_students_tested: totalTested,
      above_count: aboveList.length,
      above_ratio_pct: Math.round((aboveList.length / totalTested) * 100),
      below_count: belowList.length,
      below_ratio_pct: Math.round((belowList.length / totalTested) * 100),
      pass_rate_pct: Math.round((passCount / totalTested) * 100),
      critical_remedial_count: studentList.filter(s => s.avg_score_pct < 40).length,
      highest_score: {
        score_pct: Number(highestStudent.avg_score_pct),
        student_name: (highestStudent.student_name || '').trim(),
        roll_number: highestStudent.roll_number,
      },
      lowest_score: {
        score_pct: Number(lowestStudent.avg_score_pct),
        student_name: (lowestStudent.student_name || '').trim(),
        roll_number: lowestStudent.roll_number,
      },
      male_count: studentList.filter(s => s.gender === 'M').length,
      female_count: studentList.filter(s => s.gender === 'F').length,
    },
    class_subject_matrix: subjects.map(s => ({
      subject_id: s.id,
      subject_name: s.name,
      subject_code: s.code,
      avg_score_pct: Number(s.avg_score_pct || 0),
      student_count: Number(s.student_count || 0),
      is_current: String(s.id) === String(activeSubjectId),
    })),
    distribution_bins: bins,
    above_benchmark_students: aboveList,
    below_benchmark_students: belowList,
  });
}

module.exports = {
  getSchoolOverview,
  getTeacherPerformance,
  getStudentDirectory,
  getSchoolExams,
  getSchoolLearningOutcomes,
  getSubjectClassBenchmark,
};

