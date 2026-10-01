const pool = require('../config/db');
const { auditLog } = require('../utils/audit');

/**
 * GET /api/assessments/:assessmentId/question-marks?student_id=&subject_id=
 */
async function getQuestionMarks(req, res) {
  const asmt = req.assessment;
  const { student_id, subject_id } = req.query;

  if (!student_id || !subject_id) {
    return res.status(400).json({ error: 'student_id and subject_id are required' });
  }

  // Get questions for this class + subject
  const questRes = await pool.query(
    `SELECT q.id, q.question_number, q.question_text, q.max_marks, q.sort_order,
            lo.lo_code, lo.description AS lo_description
     FROM sd_questions q
     LEFT JOIN sd_learning_outcomes lo ON lo.id = q.lo_id
     WHERE q.class_id = $1 AND q.subject_id = $2
       AND (q.academic_year_id IS NULL OR q.academic_year_id = $3)
       AND q.is_active = true
     ORDER BY q.sort_order, q.question_number`,
    [asmt.class_id, subject_id, asmt.academic_year_id]
  );

  // Get existing marks
  const marksRes = await pool.query(
    `SELECT question_id, marks_obtained, max_marks, is_absent, updated_at
     FROM sd_question_marks
     WHERE assessment_id = $1 AND student_id = $2 AND subject_id = $3`,
    [asmt.id, student_id, subject_id]
  );

  const marksMap = {};
  for (const m of marksRes.rows) marksMap[m.question_id] = m;

  // Get student info
  const studRes = await pool.query(
    `SELECT id, roll_number, student_name FROM sd_students WHERE id = $1`,
    [student_id]
  );

  const questionMarks = questRes.rows.map(q => {
    const m = marksMap[q.id];
    return {
      question_id: q.id,
      question_number: q.question_number,
      question_text: q.question_text,
      max_marks: q.max_marks,
      lo_code: q.lo_code,
      lo_description: q.lo_description,
      marks_obtained: m?.marks_obtained ?? null,
      is_absent: m?.is_absent ?? false,
      updated_at: m?.updated_at ?? null,
    };
  });

  const totalMax = questionMarks.reduce((acc, q) => acc + q.max_marks, 0);
  const totalObtained = questionMarks.every(q => q.marks_obtained !== null)
    ? questionMarks.reduce((acc, q) => acc + Number(q.marks_obtained), 0)
    : null;

  res.json({
    student: studRes.rows[0] || null,
    question_marks: questionMarks,
    total_obtained: totalObtained,
    total_max: totalMax,
    percentage: totalObtained !== null && totalMax > 0
      ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : null,
  });
}

/**
 * POST /api/assessments/:assessmentId/question-marks/bulk
 * Bulk upsert question-level marks for a student+subject (MODE B).
 *
 * Body: { student_id, subject_id, marks: [{ question_id, marks_obtained, is_absent }] }
 *
 * CRITICAL: After saving, automatically updates sd_subject_marks.data_source = 'DERIVED_FROM_QUESTIONS'
 * and recalculates subject total from question totals to keep data consistent.
 */
async function bulkSaveQuestionMarks(req, res) {
  const asmt = req.assessment;
  const user = req.user;
  const { student_id, subject_id, marks } = req.body;

  if (!student_id || !subject_id) {
    return res.status(400).json({ error: 'student_id and subject_id are required' });
  }
  if (!marks || !Array.isArray(marks) || marks.length === 0) {
    return res.status(400).json({ error: 'marks array is required' });
  }

  if (asmt.status === 'LOCKED') {
    return res.status(409).json({ error: 'Assessment is locked and cannot be modified' });
  }

  // Validate student belongs to this assessment's class
  const studRes = await pool.query(
    `SELECT id FROM sd_students
     WHERE id = $1 AND school_udise = $2 AND class_id = $3
       AND academic_year_id = $4 AND is_active = true`,
    [student_id, asmt.school_udise, asmt.class_id, asmt.academic_year_id]
  );
  if (!studRes.rowCount) {
    return res.status(403).json({ error: 'Student does not belong to this class/assessment' });
  }

  // Get questions with max_marks and lo_id
  const questionIds = marks.map(m => m.question_id);
  const questRes = await pool.query(
    `SELECT id, max_marks, lo_id FROM sd_questions WHERE id = ANY($1) AND is_active = true`,
    [questionIds]
  );
  const questMap = {};
  for (const q of questRes.rows) questMap[q.id] = q;

  // Validate marks
  const errors = [];
  for (const m of marks) {
    const q = questMap[m.question_id];
    if (!q) { errors.push(`Question ${m.question_id} not found`); continue; }
    if (m.marks_obtained < 0) errors.push(`Marks for Q${m.question_id} cannot be negative`);
    if (m.marks_obtained > q.max_marks) {
      errors.push(`Marks ${m.marks_obtained} for Q${m.question_id} exceeds max ${q.max_marks}`);
    }
  }
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  // Get assessment's max_marks for this subject
  const asmtSubjRes = await pool.query(
    `SELECT max_marks FROM sd_assessment_subjects WHERE assessment_id = $1 AND subject_id = $2`,
    [asmt.id, subject_id]
  );
  const subjectMaxMarks = asmtSubjRes.rows[0]?.max_marks || 100;

  // Calculate derived subject total
  const derivedTotal = marks.reduce((acc, m) => acc + Number(m.marks_obtained || 0), 0);
  if (derivedTotal > subjectMaxMarks) {
    return res.status(400).json({
      error: `Question-wise total ${derivedTotal} exceeds subject maximum ${subjectMaxMarks}`,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Save question marks
    for (const m of marks) {
      const q = questMap[m.question_id];
      await client.query(
        `INSERT INTO sd_question_marks
           (assessment_id, student_id, subject_id, question_id, lo_id, marks_obtained, max_marks, is_absent, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
         ON CONFLICT (assessment_id, student_id, question_id) DO UPDATE SET
           marks_obtained = EXCLUDED.marks_obtained,
           is_absent = EXCLUDED.is_absent,
           lo_id = EXCLUDED.lo_id,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()`,
        [asmt.id, student_id, subject_id, m.question_id, q.lo_id,
         m.marks_obtained, q.max_marks, m.is_absent ?? false, user.id]
      );
    }

    // Automatically derive and update sd_subject_marks from question totals
    await client.query(
      `INSERT INTO sd_subject_marks
         (assessment_id, student_id, subject_id, marks_obtained, max_marks, data_source, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,'DERIVED_FROM_QUESTIONS',$6,$6)
       ON CONFLICT (assessment_id, student_id, subject_id) DO UPDATE SET
         marks_obtained = EXCLUDED.marks_obtained,
         data_source = 'DERIVED_FROM_QUESTIONS',
         updated_by = EXCLUDED.updated_by,
         updated_at = now()`,
      [asmt.id, student_id, subject_id, derivedTotal, subjectMaxMarks, user.id]
    );

    await client.query(`UPDATE sd_assessments SET updated_at = now() WHERE id = $1`, [asmt.id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await auditLog({ userId: user.id, username: user.username, action: 'UPDATE',
    entityType: 'question_marks', entityId: asmt.id,
    newValue: { student_id, subject_id, marks_count: marks.length, derived_total: derivedTotal }, req });

  res.json({
    message: `${marks.length} question mark(s) saved. Subject total auto-updated to ${derivedTotal}/${subjectMaxMarks}`,
    derived_subject_total: derivedTotal,
    subject_max_marks: subjectMaxMarks,
  });
}

module.exports = { getQuestionMarks, bulkSaveQuestionMarks };
