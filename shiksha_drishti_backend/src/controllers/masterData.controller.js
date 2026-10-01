const pool = require('../config/db');

/**
 * GET /api/schools/:udise
 * Returns school info from master data. Teachers see their own school only.
 */
async function getSchool(req, res) {
  const { udise } = req.params;
  const user = req.user;

  // Teachers can only view their assigned school
  if (user.role === 'TEACHER' && String(user.primary_udise) !== String(udise)) {
    return res.status(403).json({ error: 'You are not authorized to view this school' });
  }

  const result = await pool.query(
    `SELECT udise_code, school_name, cluster_cd, cluster_name,
            block_cd, block_name, district_cd, district_name,
            latitude, longitude, hos_name, hos_mobile, school_type, school_management
     FROM sd_schools WHERE udise_code = $1`,
    [udise]
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: 'School not found for this UDISE code' });
  }

  res.json(result.rows[0]);
}

/**
 * GET /api/classes/:classId/students?school_udise=&academic_year_id=
 * Returns students for a class. Teacher must be assigned to this class.
 */
async function getClassStudents(req, res) {
  const { classId } = req.params;
  let { school_udise, academic_year_id } = req.query;
  const user = req.user;

  school_udise = school_udise || user.primary_udise;

  if (!academic_year_id) {
    const activeYearRes = await pool.query(`SELECT id FROM sd_academic_years WHERE is_active = true LIMIT 1`);
    if (activeYearRes.rowCount) {
      academic_year_id = activeYearRes.rows[0].id;
    }
  }

  if (!school_udise || !academic_year_id) {
    return res.status(400).json({ error: 'school_udise and academic_year_id could not be resolved' });
  }

  // Teacher authorization: check assignment
  if (user.role === 'TEACHER') {
    const assignRes = await pool.query(
      `SELECT 1 FROM sd_teacher_assignments
       WHERE user_id = $1 AND school_udise = $2 AND class_id = $3
         AND is_active = true`,
      [user.id, school_udise, classId]
    );
    if (!assignRes.rowCount) {
      return res.status(403).json({ error: 'You are not authorized to access this class' });
    }
  }

  const studentsRes = await pool.query(
    `SELECT id, roll_number, student_name, gender, guardian_name, dob, is_active
     FROM sd_students
     WHERE school_udise = $1 AND class_id = $2 AND academic_year_id = $3
       AND is_active = true
     ORDER BY roll_number ASC`,
    [school_udise, classId, academic_year_id]
  );

  res.json(studentsRes.rows);
}

/**
 * GET /api/academic-years
 */
async function getAcademicYears(req, res) {
  const result = await pool.query(
    `SELECT id, year_label, start_date, end_date, is_active
     FROM sd_academic_years ORDER BY start_date DESC`
  );
  res.json(result.rows);
}

/**
 * GET /api/subjects
 */
async function getSubjects(req, res) {
  const result = await pool.query(
    `SELECT id, name, code, default_max_marks, sort_order
     FROM sd_subjects WHERE is_active = true ORDER BY sort_order`
  );
  res.json(result.rows);
}

/**
 * GET /api/questions?class_id=&subject_id=&academic_year_id=
 */
async function getQuestions(req, res) {
  const { class_id, subject_id, academic_year_id } = req.query;

  if (!class_id || !subject_id) {
    return res.status(400).json({ error: 'class_id and subject_id are required' });
  }

  const result = await pool.query(
    `SELECT q.id, q.question_number, q.question_text, q.max_marks, q.sort_order,
            q.question_type, lo.lo_code, lo.description AS lo_description
     FROM sd_questions q
     LEFT JOIN sd_learning_outcomes lo ON lo.id = q.lo_id
     WHERE q.class_id = $1 AND q.subject_id = $2
       AND ($3::bigint IS NULL OR q.academic_year_id = $3)
       AND q.is_active = true
     ORDER BY q.sort_order, q.question_number`,
    [class_id, subject_id, academic_year_id || null]
  );

  res.json(result.rows);
}

/**
 * GET /api/learning-outcomes?class_id=&subject_id=
 */
async function getLearningOutcomes(req, res) {
  const { class_id, subject_id } = req.query;

  const result = await pool.query(
    `SELECT id, lo_code, description
     FROM sd_learning_outcomes
     WHERE ($1::bigint IS NULL OR class_id = $1)
       AND ($2::bigint IS NULL OR subject_id = $2)
       AND is_active = true
     ORDER BY lo_code`,
    [class_id || null, subject_id || null]
  );

  res.json(result.rows);
}

/**
 * GET /api/classes
 * Returns all active classes
 */
async function getClasses(req, res) {
  const result = await pool.query(
    `SELECT id, class_num, class_name FROM sd_classes WHERE is_active = true ORDER BY class_num ASC`
  );
  res.json(result.rows);
}

module.exports = { getSchool, getClassStudents, getAcademicYears, getSubjects, getQuestions, getLearningOutcomes, getClasses };
