/**
 * authorize: Role-based access control middleware.
 * Usage: authorize('STATE_ADMIN', 'DISTRICT_OFFICER')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `You are not authorized to perform this action. Required role: ${allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
}

/**
 * authorizeTeacherClass: Verifies teacher is assigned to the requested
 * assessment's school and class. Prevents cross-school data access.
 * Attaches assessment to req.assessment.
 */
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const authorizeAssessmentAccess = asyncHandler(async (req, res, next) => {
  const { assessmentId } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  const asmtRes = await pool.query(
    `SELECT a.*, ay.year_label
     FROM sd_assessments a
     JOIN sd_academic_years ay ON ay.id = a.academic_year_id
     WHERE a.id = $1`,
    [assessmentId]
  );

  if (!asmtRes.rowCount) {
    return res.status(404).json({ error: 'Assessment not found' });
  }

  const asmt = asmtRes.rows[0];

  // State admins can access all assessments
  if (['STATE_ADMIN', 'SUPER_ADMIN', 'DATA_ANALYST'].includes(role)) {
    req.assessment = asmt;
    return next();
  }

  // Teachers/School admins: must be assigned to this school+class
  const assignRes = await pool.query(
    `SELECT 1 FROM sd_teacher_assignments
     WHERE user_id = $1 AND school_udise = $2 AND class_id = $3
       AND academic_year_id = $4 AND is_active = true`,
    [userId, asmt.school_udise, asmt.class_id, asmt.academic_year_id]
  );

  if (!assignRes.rowCount) {
    return res.status(403).json({
      error: 'You are not authorized to access this assessment',
    });
  }

  req.assessment = asmt;
  next();
});

module.exports = { authorize, authorizeAssessmentAccess };
