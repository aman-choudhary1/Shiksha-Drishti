const pool = require('../config/db');
const { auditLog } = require('../utils/audit');

/**
 * GET /api/assessments?school_udise=&class_id=&academic_year_id=
 */
async function listAssessments(req, res) {
  const { school_udise, class_id, academic_year_id } = req.query;
  const user = req.user;

  // Build scope-aware filter
  let udise = school_udise;
  if (user.role === 'TEACHER') udise = user.primary_udise;

  const result = await pool.query(
    `SELECT a.id, a.academic_year_id, a.school_udise, a.class_id,
            a.assessment_name, a.assessment_type, a.status,
            a.created_at, a.submitted_at, a.updated_at,
            ay.year_label, c.class_name, c.class_num, s.school_name,
            u.full_name AS created_by_name,
            -- Completion stats from view
            vs.total_students,
            vs.students_with_subject_marks,
            vs.students_with_question_marks
     FROM sd_assessments a
     JOIN sd_academic_years ay ON ay.id = a.academic_year_id
     JOIN sd_classes c ON c.id = a.class_id
     JOIN sd_schools s ON s.udise_code = a.school_udise
     JOIN sd_users u ON u.id = a.created_by
     LEFT JOIN vw_sd_assessment_status vs ON vs.assessment_id = a.id
     WHERE ($1::bigint IS NULL OR a.school_udise = $1)
       AND ($2::bigint IS NULL OR a.class_id = $2)
       AND ($3::bigint IS NULL OR a.academic_year_id = $3)
     ORDER BY a.created_at DESC`,
    [udise || null, class_id || null, academic_year_id || null]
  );

  res.json(result.rows);
}

/**
 * POST /api/assessments
 */
async function createAssessment(req, res) {
  const { school_udise, class_id, academic_year_id, assessment_name, assessment_type, subject_ids } = req.body;
  const user = req.user;

  if (!school_udise || !class_id || !academic_year_id || !assessment_name) {
    return res.status(400).json({ error: 'school_udise, class_id, academic_year_id, assessment_name are required' });
  }

  // Ensure effective school UDISE
  const effectiveUdise = school_udise || user.primary_udise;
  if (!effectiveUdise) {
    return res.status(400).json({ error: 'School UDISE is required' });
  }

  // Teacher self-assignment / empowerment
  if (user.role === 'TEACHER') {
    // If not already assigned, record teacher assignment so they own this class assessment
    await pool.query(
      `INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, school_udise, class_id, academic_year_id) DO UPDATE SET is_active = true`,
      [user.id, effectiveUdise, class_id, academic_year_id]
    ).catch(() => {}); // soft catch if unique constraint differs
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const asmtRes = await client.query(
      `INSERT INTO sd_assessments
         (academic_year_id, school_udise, class_id, assessment_name, assessment_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [academic_year_id, school_udise, class_id, assessment_name, assessment_type || 'TERM', user.id]
    );
    const asmt = asmtRes.rows[0];

    // Add subjects (default all active subjects if none specified)
    let subjectIds = subject_ids;
    if (!subjectIds || !subjectIds.length) {
      const subjRes = await client.query(`SELECT id FROM sd_subjects WHERE is_active = true ORDER BY sort_order`);
      subjectIds = subjRes.rows.map(r => r.id);
    }
    for (let i = 0; i < subjectIds.length; i++) {
      await client.query(
        `INSERT INTO sd_assessment_subjects (assessment_id, subject_id, sort_order)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [asmt.id, subjectIds[i], i + 1]
      );
    }

    await client.query('COMMIT');

    await auditLog({ userId: user.id, username: user.username, action: 'CREATE',
      entityType: 'assessment', entityId: asmt.id, newValue: asmt, req });

    res.status(201).json(asmt);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * GET /api/assessments/:assessmentId
 */
async function getAssessment(req, res) {
  const asmt = req.assessment; // set by authorizeAssessmentAccess middleware

  // Get subjects
  const subjRes = await pool.query(
    `SELECT asub.subject_id, asub.max_marks, asub.sort_order,
            sub.name AS subject_name, sub.code AS subject_code
     FROM sd_assessment_subjects asub
     JOIN sd_subjects sub ON sub.id = asub.subject_id
     WHERE asub.assessment_id = $1
     ORDER BY asub.sort_order`,
    [asmt.id]
  );

  res.json({ ...asmt, subjects: subjRes.rows });
}

/**
 * PATCH /api/assessments/:assessmentId
 */
async function updateAssessment(req, res) {
  const asmt = req.assessment;
  const { assessment_name, notes } = req.body;
  const user = req.user;

  if (asmt.status === 'LOCKED') {
    return res.status(409).json({ error: 'This assessment is locked and cannot be modified' });
  }

  const updated = await pool.query(
    `UPDATE sd_assessments
     SET assessment_name = COALESCE($1, assessment_name),
         notes = COALESCE($2, notes),
         updated_at = now()
     WHERE id = $3 RETURNING *`,
    [assessment_name, notes, asmt.id]
  );

  await auditLog({ userId: user.id, username: user.username, action: 'UPDATE',
    entityType: 'assessment', entityId: asmt.id,
    oldValue: { assessment_name: asmt.assessment_name },
    newValue: { assessment_name, notes }, req });

  res.json(updated.rows[0]);
}

/**
 * GET /api/assessments/:assessmentId/status
 * Returns detailed completion status for the assessment
 */
async function getAssessmentStatus(req, res) {
  const asmt = req.assessment;

  const statusRes = await pool.query(
    `SELECT
       vs.total_students,
       vs.students_with_subject_marks,
       vs.students_with_question_marks,
       a.status,
       -- List of students missing subject marks
       COALESCE(
         (SELECT json_agg(json_build_object('roll', st.roll_number, 'name', st.student_name))
          FROM sd_students st
          WHERE st.school_udise = a.school_udise
            AND st.class_id = a.class_id
            AND st.academic_year_id = a.academic_year_id
            AND st.is_active = true
            AND NOT EXISTS (
              SELECT 1 FROM sd_subject_marks sm
              WHERE sm.assessment_id = a.id AND sm.student_id = st.id
                AND sm.marks_obtained IS NOT NULL
            )
         ), '[]'::json
       ) AS students_missing_marks
     FROM sd_assessments a
     JOIN vw_sd_assessment_status vs ON vs.assessment_id = a.id
     WHERE a.id = $1`,
    [asmt.id]
  );

  res.json(statusRes.rows[0] || {});
}

/**
 * POST /api/assessments/:assessmentId/submit
 */
async function submitAssessment(req, res) {
  const asmt = req.assessment;
  const user = req.user;

  if (asmt.status === 'SUBMITTED' || asmt.status === 'LOCKED') {
    return res.status(409).json({ error: `Assessment is already ${asmt.status.toLowerCase()}` });
  }

  // Count students with missing subject marks
  const missingRes = await pool.query(
    `SELECT COUNT(*) AS missing_count
     FROM sd_students st
     WHERE st.school_udise = $1 AND st.class_id = $2
       AND st.academic_year_id = $3 AND st.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM sd_subject_marks sm
         WHERE sm.assessment_id = $4 AND sm.student_id = st.id
           AND sm.marks_obtained IS NOT NULL
       )`,
    [asmt.school_udise, asmt.class_id, asmt.academic_year_id, asmt.id]
  );

  const missingCount = Number(missingRes.rows[0]?.missing_count || 0);
  if (missingCount > 0) {
    return res.status(422).json({
      error: `Cannot submit: ${missingCount} student(s) are missing subject marks. Please complete marks entry first.`,
      missing_count: missingCount,
    });
  }

  // Get student counts for snapshot
  const countRes = await pool.query(
    `SELECT COUNT(DISTINCT st.id) AS total,
            COUNT(DISTINCT sm.student_id) AS entered
     FROM sd_students st
     LEFT JOIN sd_subject_marks sm ON sm.assessment_id = $1 AND sm.student_id = st.id
       AND sm.marks_obtained IS NOT NULL
     WHERE st.school_udise = $2 AND st.class_id = $3
       AND st.academic_year_id = $4 AND st.is_active = true`,
    [asmt.id, asmt.school_udise, asmt.class_id, asmt.academic_year_id]
  );

  const updated = await pool.query(
    `UPDATE sd_assessments
     SET status = 'SUBMITTED', submitted_at = now(), submitted_by = $1,
         total_students = $2, students_entered = $3, updated_at = now()
     WHERE id = $4 RETURNING *`,
    [user.id, countRes.rows[0]?.total, countRes.rows[0]?.entered, asmt.id]
  );

  await auditLog({ userId: user.id, username: user.username, action: 'SUBMIT',
    entityType: 'assessment', entityId: asmt.id,
    newValue: { status: 'SUBMITTED' }, req });

  res.json({ message: 'Assessment submitted successfully', assessment: updated.rows[0] });
}

/**
 * GET /api/assessments/:assessmentId/analytics
 * Returns comprehensive student performance analysis, weak areas, and remedial recommendations.
 */
async function getAssessmentAnalytics(req, res) {
  const asmt = req.assessment;

  // 1. Get subjects
  const subjRes = await pool.query(
    `SELECT asub.subject_id, asub.max_marks, sub.name AS subject_name, sub.code
     FROM sd_assessment_subjects asub
     JOIN sd_subjects sub ON sub.id = asub.subject_id
     WHERE asub.assessment_id = $1 ORDER BY asub.sort_order`,
    [asmt.id]
  );
  const subjects = subjRes.rows;

  // 2. Get students and their subject marks
  const marksRes = await pool.query(
    `SELECT sm.student_id, sm.subject_id, sm.marks_obtained, sm.max_marks, sm.is_absent,
            st.roll_number, st.student_name, st.gender
     FROM sd_students st
     LEFT JOIN sd_subject_marks sm ON sm.student_id = st.id AND sm.assessment_id = $1
     WHERE st.school_udise = $2 AND st.class_id = $3 AND st.academic_year_id = $4 AND st.is_active = true
     ORDER BY st.roll_number`,
    [asmt.id, asmt.school_udise, asmt.class_id, asmt.academic_year_id]
  );

  // Group marks by student
  const studentMap = {};
  for (const row of marksRes.rows) {
    if (!studentMap[row.student_id]) {
      studentMap[row.student_id] = {
        student_id: row.student_id,
        roll_number: row.roll_number,
        student_name: row.student_name,
        gender: row.gender,
        subject_marks: {},
        total_obtained: 0,
        total_max: 0,
        has_any_mark: false,
        all_absent: true,
        absent_subjects_count: 0,
        failed_subjects: [],
      };
    }

    if (row.subject_id) {
      studentMap[row.student_id].subject_marks[row.subject_id] = {
        marks_obtained: row.marks_obtained,
        max_marks: row.max_marks,
        is_absent: row.is_absent,
      };

      if (!row.is_absent) {
        studentMap[row.student_id].all_absent = false;
        if (row.marks_obtained !== null && row.marks_obtained !== undefined) {
          studentMap[row.student_id].has_any_mark = true;
          studentMap[row.student_id].total_obtained += Number(row.marks_obtained);
          studentMap[row.student_id].total_max += Number(row.max_marks);

          // Check subject pass (>= 33%)
          const subjPct = (Number(row.marks_obtained) / Number(row.max_marks)) * 100;
          if (subjPct < 33) {
            const subjName = subjects.find(s => s.subject_id === row.subject_id)?.subject_name || 'Subject';
            studentMap[row.student_id].failed_subjects.push({
              subject_name: subjName,
              marks_obtained: row.marks_obtained,
              max_marks: row.max_marks,
              percentage: subjPct.toFixed(1),
            });
          }
        }
      } else {
        studentMap[row.student_id].absent_subjects_count++;
      }
    }
  }

  const studentList = Object.values(studentMap);
  const totalStudents = studentList.length;

  let totalPctSum = 0;
  let evaluatedStudentsCount = 0;
  let absentStudentsCount = 0;
  let passCount = 0;
  let highestPct = 0;
  let lowestPct = 100;

  const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0 };

  const studentRoster = studentList.map(st => {
    let percentage = null;
    let tier = 'PENDING';

    if (st.all_absent && st.absent_subjects_count > 0) {
      absentStudentsCount++;
      tier = 'ABSENT';
    } else if (st.total_max > 0 && st.has_any_mark) {
      percentage = parseFloat(((st.total_obtained / st.total_max) * 100).toFixed(1));
      evaluatedStudentsCount++;
      totalPctSum += percentage;

      if (percentage > highestPct) highestPct = percentage;
      if (percentage < lowestPct) lowestPct = percentage;
      if (percentage >= 33) passCount++;

      if (percentage >= 80) {
        gradeCounts['A+']++;
        tier = 'EXCELLENT';
      } else if (percentage >= 65) {
        gradeCounts['A']++;
        tier = 'GOOD';
      } else if (percentage >= 50) {
        gradeCounts['B']++;
        tier = 'AVERAGE';
      } else if (percentage >= 33) {
        gradeCounts['C']++;
        tier = 'NEEDS_PULL';
      } else {
        gradeCounts['D']++;
        tier = 'CRITICAL_ATTENTION';
      }
    }

    return {
      student_id: st.student_id,
      roll_number: st.roll_number,
      student_name: st.student_name,
      gender: st.gender,
      total_obtained: st.has_any_mark ? st.total_obtained : null,
      total_max: st.total_max,
      percentage,
      tier,
      failed_subjects: st.failed_subjects,
      is_absent: tier === 'ABSENT',
    };
  });

  const classAveragePct = evaluatedStudentsCount > 0 ? parseFloat((totalPctSum / evaluatedStudentsCount).toFixed(1)) : 0;
  const passRatePct = evaluatedStudentsCount > 0 ? parseFloat(((passCount / evaluatedStudentsCount) * 100).toFixed(1)) : 0;

  // 3. Subject-wise analysis
  const subjectAnalytics = subjects.map(subj => {
    let subTotalMarks = 0;
    let subAssessedCount = 0;
    let subPassCount = 0;
    let subHighest = 0;
    let subLowest = subj.max_marks;

    for (const st of studentList) {
      const sm = st.subject_marks[subj.subject_id];
      if (sm && !sm.is_absent && sm.marks_obtained !== null && sm.marks_obtained !== undefined) {
        const val = Number(sm.marks_obtained);
        subTotalMarks += val;
        subAssessedCount++;
        if (val > subHighest) subHighest = val;
        if (val < subLowest) subLowest = val;
        if ((val / subj.max_marks) * 100 >= 33) subPassCount++;
      }
    }

    const avgMarks = subAssessedCount > 0 ? parseFloat((subTotalMarks / subAssessedCount).toFixed(1)) : 0;
    const avgPct = subAssessedCount > 0 ? parseFloat(((avgMarks / subj.max_marks) * 100).toFixed(1)) : 0;
    const passPct = subAssessedCount > 0 ? parseFloat(((subPassCount / subAssessedCount) * 100).toFixed(1)) : 0;

    return {
      subject_id: subj.subject_id,
      subject_name: subj.subject_name,
      subject_code: subj.code,
      max_marks: subj.max_marks,
      assessed_count: subAssessedCount,
      average_marks: avgMarks,
      average_pct: avgPct,
      pass_pct: passPct,
      highest_marks: subAssessedCount > 0 ? subHighest : 0,
      lowest_marks: subAssessedCount > 0 ? subLowest : 0,
      needs_attention: avgPct < 55 || passPct < 60,
    };
  });

  // Sort subjects by average_pct ascending (weakest first)
  subjectAnalytics.sort((a, b) => a.average_pct - b.average_pct);

  // 4. Learning Outcome (LO) performance & weak points
  const loMarksRes = await pool.query(
    `SELECT qm.lo_id, lo.lo_code, lo.description AS lo_description,
            sub.name AS subject_name, qm.max_marks,
            COUNT(DISTINCT qm.student_id) AS assessed_count,
            AVG(qm.marks_obtained) AS avg_marks,
            COUNT(CASE WHEN qm.marks_obtained IS NOT NULL AND (qm.marks_obtained::float / NULLIF(qm.max_marks, 0)) < 0.4 THEN 1 END) AS weak_students_count
     FROM sd_question_marks qm
     JOIN sd_learning_outcomes lo ON lo.id = qm.lo_id
     JOIN sd_subjects sub ON sub.id = qm.subject_id
     WHERE qm.assessment_id = $1 AND qm.is_absent = false AND qm.marks_obtained IS NOT NULL
     GROUP BY qm.lo_id, lo.lo_code, lo.description, sub.name, qm.max_marks
     ORDER BY AVG(qm.marks_obtained::float / NULLIF(qm.max_marks, 0)) ASC`,
    [asmt.id]
  );

  const loInsights = loMarksRes.rows.map(lo => {
    const avgM = parseFloat(Number(lo.avg_marks || 0).toFixed(1));
    const maxM = Number(lo.max_marks || 1);
    const avgPct = parseFloat(((avgM / maxM) * 100).toFixed(1));
    const weakCount = Number(lo.weak_students_count || 0);

    return {
      lo_id: lo.lo_id,
      lo_code: lo.lo_code,
      lo_description: lo.lo_description,
      subject_name: lo.subject_name,
      max_marks: maxM,
      avg_marks: avgM,
      avg_pct: avgPct,
      weak_students_count: weakCount,
      is_critical: avgPct < 50 || weakCount >= 3,
    };
  });

  // Generate actionable remedial suggestions
  const remedialSuggestions = [];
  if (subjectAnalytics.length > 0 && subjectAnalytics[0].needs_attention) {
    remedialSuggestions.push({
      priority: 'HIGH',
      subject: subjectAnalytics[0].subject_name,
      message: `${subjectAnalytics[0].subject_name} में कक्षा का औसत सबसे कम (${subjectAnalytics[0].average_pct}%) है। इस विषय पर अतिरिक्त शिक्षण एवं पुनरावृत्ति सत्र की तत्काल आवश्यकता है।`,
    });
  }

  for (const lo of loInsights.filter(l => l.is_critical).slice(0, 4)) {
    remedialSuggestions.push({
      priority: 'CRITICAL',
      subject: lo.subject_name,
      lo_code: lo.lo_code,
      message: `अधिगम परिणाम [${lo.lo_code}: ${lo.lo_description}] में ${lo.weak_students_count} विद्यार्थी 40% से कम अंक प्राप्त कर सके। इसके लिए दृश्य सहायक सामग्री (DIKSHA / TLM) से उपचारात्मक कक्षा लें।`,
    });
  }

  const criticalStudents = studentRoster.filter(s => s.tier === 'CRITICAL_ATTENTION');
  if (criticalStudents.length > 0) {
    remedialSuggestions.push({
      priority: 'STUDENT_LEVEL',
      message: `${criticalStudents.length} विद्यार्थी (उदा. ${criticalStudents.slice(0, 3).map(s => s.student_name).join(', ')}) को व्यक्तिगत उपचारात्मक सहायता (Individual Attention) की आवश्यकता है।`,
    });
  }

  res.json({
    assessment: {
      id: asmt.id,
      assessment_name: asmt.assessment_name,
      class_name: asmt.class_name,
      school_name: asmt.school_name,
      year_label: asmt.year_label,
      status: asmt.status,
    },
    class_summary: {
      total_students: totalStudents,
      evaluated_students: evaluatedStudentsCount,
      absent_students: absentStudentsCount,
      class_average_pct: classAveragePct,
      pass_count: passCount,
      pass_rate_pct: passRatePct,
      highest_pct: evaluatedStudentsCount > 0 ? highestPct : 0,
      lowest_pct: evaluatedStudentsCount > 0 ? lowestPct : 0,
      grade_distribution: gradeCounts,
    },
    subject_analytics: subjectAnalytics,
    learning_outcome_insights: loInsights,
    remedial_suggestions: remedialSuggestions,
    student_roster: studentRoster,
  });
}

module.exports = {
  listAssessments,
  createAssessment,
  getAssessment,
  updateAssessment,
  getAssessmentStatus,
  submitAssessment,
  getAssessmentAnalytics,
};

