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

/**
 * GET /api/master/districts
 * Returns all 33 districts of Chhattisgarh with summary counts
 */
async function getDistricts(req, res) {
  const result = await pool.query(`
    SELECT d.district_cd, d.district_name,
      COUNT(DISTINCT b.block_cd)   AS total_blocks,
      COUNT(DISTINCT s.udise_code) AS total_schools
    FROM sd_districts d
    LEFT JOIN sd_blocks b ON b.district_cd = d.district_cd
    LEFT JOIN sd_schools s ON s.district_cd = d.district_cd
    GROUP BY d.district_cd, d.district_name
    ORDER BY d.district_name ASC
  `);
  res.json(result.rows);
}

/**
 * GET /api/master/blocks?district_cd=&district_name=
 * Returns blocks, optionally filtered by district
 */
async function getBlocks(req, res) {
  const { district_cd, district_name } = req.query;
  const params = [];
  const conds = [];

  if (district_cd && district_cd !== 'ALL') {
    params.push(district_cd);
    conds.push(`(b.district_cd = $${params.length})`);
  }
  if (district_name && district_name !== 'ALL') {
    params.push(`%${district_name}%`);
    conds.push(`(b.district_name ILIKE $${params.length})`);
  }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const result = await pool.query(`
    SELECT b.block_cd, b.block_name, b.district_cd, b.district_name,
      COUNT(DISTINCT c.cluster_cd) AS total_clusters,
      COUNT(DISTINCT s.udise_code) AS total_schools
    FROM sd_blocks b
    LEFT JOIN sd_clusters c ON c.block_cd = b.block_cd
    LEFT JOIN sd_schools s ON s.block_cd = b.block_cd
    ${where}
    GROUP BY b.block_cd, b.block_name, b.district_cd, b.district_name
    ORDER BY b.district_name ASC, b.block_name ASC
  `, params);

  res.json(result.rows);
}

/**
 * GET /api/master/clusters?block_cd=&district_cd=&block_name=
 * Returns clusters, optionally filtered
 */
async function getClusters(req, res) {
  const { block_cd, district_cd, block_name, district_name } = req.query;
  const params = [];
  const conds = [];

  if (block_cd && block_cd !== 'ALL') {
    params.push(block_cd);
    conds.push(`(c.block_cd = $${params.length})`);
  }
  if (district_cd && district_cd !== 'ALL') {
    params.push(district_cd);
    conds.push(`(c.district_cd = $${params.length})`);
  }
  if (block_name && block_name !== 'ALL') {
    params.push(`%${block_name}%`);
    conds.push(`(c.block_name ILIKE $${params.length})`);
  }
  if (district_name && district_name !== 'ALL') {
    params.push(`%${district_name}%`);
    conds.push(`(c.district_name ILIKE $${params.length})`);
  }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const result = await pool.query(`
    SELECT c.cluster_cd, c.cluster_name, c.block_cd, c.block_name, c.district_cd, c.district_name,
      COUNT(DISTINCT s.udise_code) AS total_schools
    FROM sd_clusters c
    LEFT JOIN sd_schools s ON s.cluster_cd = c.cluster_cd
    ${where}
    GROUP BY c.cluster_cd, c.cluster_name, c.block_cd, c.block_name, c.district_cd, c.district_name
    ORDER BY c.district_name ASC, c.block_name ASC, c.cluster_name ASC
  `, params);

  res.json(result.rows);
}

/**
 * GET /api/master/schools?district_cd=&block_cd=&cluster_cd=&search=&limit=
 */
async function getSchoolsList(req, res) {
  const { district_cd, district_name, block_cd, block_name, cluster_cd, search, limit = 100 } = req.query;
  const params = [];
  const conds = ['is_active = true'];

  if (district_cd && district_cd !== 'ALL') {
    params.push(district_cd);
    conds.push(`(district_cd = $${params.length})`);
  }
  if (district_name && district_name !== 'ALL') {
    params.push(`%${district_name}%`);
    conds.push(`(district_name ILIKE $${params.length})`);
  }
  if (block_cd && block_cd !== 'ALL') {
    params.push(block_cd);
    conds.push(`(block_cd = $${params.length})`);
  }
  if (block_name && block_name !== 'ALL') {
    params.push(`%${block_name}%`);
    conds.push(`(block_name ILIKE $${params.length})`);
  }
  if (cluster_cd && cluster_cd !== 'ALL') {
    params.push(cluster_cd);
    conds.push(`(cluster_cd = $${params.length})`);
  }
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conds.push(`(school_name ILIKE $${params.length} OR udise_code::text ILIKE $${params.length})`);
  }

  params.push(Math.min(Number(limit) || 100, 500));
  const result = await pool.query(`
    SELECT udise_code, school_name, cluster_cd, cluster_name, block_cd, block_name,
           district_cd, district_name, school_type, school_management, hos_name, hos_mobile
    FROM sd_schools
    WHERE ${conds.join(' AND ')}
    ORDER BY district_name ASC, block_name ASC, school_name ASC
    LIMIT $${params.length}
  `, params);

  res.json(result.rows);
}

module.exports = {
  getSchool,
  getClassStudents,
  getAcademicYears,
  getSubjects,
  getQuestions,
  getLearningOutcomes,
  getClasses,
  getDistricts,
  getBlocks,
  getClusters,
  getSchoolsList,
};
