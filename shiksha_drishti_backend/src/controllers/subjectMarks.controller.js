const pool = require('../config/db');
const { auditLog } = require('../utils/audit');

/**
 * GET /api/assessments/:assessmentId/subject-marks
 * Returns the class report-card for this assessment.
 */
async function getSubjectMarks(req, res) {
  const { id: assessmentId, school_udise, class_id, academic_year_id } = req.assessment;

  // Get subjects for this assessment
  const subjRes = await pool.query(
    `SELECT asub.subject_id, asub.max_marks, sub.name AS subject_name, sub.code, asub.sort_order
     FROM sd_assessment_subjects asub
     JOIN sd_subjects sub ON sub.id = asub.subject_id
     WHERE asub.assessment_id = $1 ORDER BY asub.sort_order`,
    [assessmentId]
  );

  // Get all students
  const studRes = await pool.query(
    `SELECT id, roll_number, student_name, gender
     FROM sd_students
     WHERE school_udise = $1 AND class_id = $2
       AND academic_year_id = $3 AND is_active = true
     ORDER BY roll_number`,
    [school_udise, class_id, academic_year_id]
  );

  // Get all existing marks for this assessment
  const marksRes = await pool.query(
    `SELECT student_id, subject_id, marks_obtained, max_marks, is_absent, data_source, updated_at
     FROM sd_subject_marks WHERE assessment_id = $1`,
    [assessmentId]
  );

  // Index marks by student_id + subject_id
  const marksMap = {};
  for (const m of marksRes.rows) {
    marksMap[`${m.student_id}-${m.subject_id}`] = m;
  }

  // Build report card structure
  const reportCard = studRes.rows.map(student => {
    const subjectMarks = subjRes.rows.map(subj => {
      const key = `${student.id}-${subj.subject_id}`;
      const mark = marksMap[key];
      return {
        subject_id: subj.subject_id,
        subject_name: subj.subject_name,
        subject_code: subj.code,
        max_marks: mark?.max_marks ?? subj.max_marks,
        marks_obtained: mark?.marks_obtained ?? null,
        is_absent: mark?.is_absent ?? false,
        data_source: mark?.data_source ?? null,
        updated_at: mark?.updated_at ?? null,
      };
    });

    const totalMax = subjectMarks.reduce((acc, s) => acc + s.max_marks, 0);
    const totalObtained = subjectMarks.reduce((acc, s) =>
      s.marks_obtained !== null ? acc + Number(s.marks_obtained) : acc, null
    );
    const percentage = totalObtained !== null
      ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2))
      : null;

    return {
      student_id: student.id,
      roll_number: student.roll_number,
      student_name: student.student_name,
      gender: student.gender,
      subject_marks: subjectMarks,
      total_obtained: totalObtained,
      total_max: totalMax,
      percentage,
    };
  });

  res.json({ subjects: subjRes.rows, report_card: reportCard });
}

/**
 * POST /api/assessments/:assessmentId/subject-marks/bulk
 * Bulk upsert subject marks for the class report card (MODE A).
 *
 * Body: { marks: [{ student_id, subject_id, marks_obtained, is_absent }] }
 */
async function bulkSaveSubjectMarks(req, res) {
  const asmt = req.assessment;
  const user = req.user;
  const { marks } = req.body;

  if (!marks || !Array.isArray(marks) || marks.length === 0) {
    return res.status(400).json({ error: 'marks array is required and must not be empty' });
  }

  if (asmt.status === 'LOCKED') {
    return res.status(409).json({ error: 'Assessment is locked and cannot be modified' });
  }

  // Validate all marks
  const errors = [];
  for (const m of marks) {
    if (m.marks_obtained !== null && m.marks_obtained !== undefined) {
      if (isNaN(m.marks_obtained) || m.marks_obtained < 0) {
        errors.push(`marks_obtained for student ${m.student_id}, subject ${m.subject_id} must be >= 0`);
      }
    }
  }
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  // Verify all student_ids belong to this assessment's school+class
  const studentIds = [...new Set(marks.map(m => m.student_id))];
  const validStudents = await pool.query(
    `SELECT id FROM sd_students
     WHERE school_udise = $1 AND class_id = $2 AND academic_year_id = $3
       AND is_active = true AND id = ANY($4)`,
    [asmt.school_udise, asmt.class_id, asmt.academic_year_id, studentIds]
  );
  const validIds = new Set(validStudents.rows.map(r => r.id));
  const invalidIds = studentIds.filter(id => !validIds.has(id));
  if (invalidIds.length) {
    return res.status(403).json({ error: `Invalid student IDs for this class: ${invalidIds.join(', ')}` });
  }

  // Get max_marks per subject from assessment
  const asmtSubjects = await pool.query(
    `SELECT subject_id, max_marks FROM sd_assessment_subjects WHERE assessment_id = $1`,
    [asmt.id]
  );
  const maxMarksMap = {};
  for (const s of asmtSubjects.rows) maxMarksMap[s.subject_id] = s.max_marks;

  // Validate marks don't exceed max
  for (const m of marks) {
    const maxMark = maxMarksMap[m.subject_id];
    if (maxMark && m.marks_obtained > maxMark) {
      errors.push(`Marks ${m.marks_obtained} exceeds maximum ${maxMark} for subject ${m.subject_id}`);
    }
  }
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const m of marks) {
      const maxMark = maxMarksMap[m.subject_id] || 100;
      await client.query(
        `INSERT INTO sd_subject_marks
           (assessment_id, student_id, subject_id, marks_obtained, max_marks, is_absent, data_source, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,'MANUAL',$7,$7)
         ON CONFLICT (assessment_id, student_id, subject_id) DO UPDATE SET
           marks_obtained = EXCLUDED.marks_obtained,
           is_absent = EXCLUDED.is_absent,
           data_source = EXCLUDED.data_source,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()`,
        [asmt.id, m.student_id, m.subject_id, m.marks_obtained ?? null, maxMark, m.is_absent ?? false, user.id]
      );
    }

    // Keep assessment in DRAFT (auto-save, not submit)
    await client.query(
      `UPDATE sd_assessments SET updated_at = now() WHERE id = $1`,
      [asmt.id]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await auditLog({ userId: user.id, username: user.username, action: 'UPDATE',
    entityType: 'subject_marks', entityId: asmt.id,
    newValue: { marks_count: marks.length }, req });

  res.json({ message: `${marks.length} subject mark(s) saved successfully`, assessment_id: asmt.id });
}

module.exports = { getSubjectMarks, bulkSaveSubjectMarks };
