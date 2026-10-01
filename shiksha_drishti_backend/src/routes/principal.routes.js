const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const {
  getSchoolOverview,
  getTeacherPerformance,
  getStudentDirectory,
  getSchoolExams,
  getSchoolLearningOutcomes,
  getSubjectClassBenchmark,
} = require('../controllers/principal.controller');

// All principal routes require authentication
router.use(authenticate);

// Middleware to check School Admin / State Admin access
function requireSchoolAdminOrHigher(req, res, next) {
  const allowed = ['SCHOOL_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'DATA_ANALYST', 'TEACHER'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access restricted to School Principals and Administrators' });
  }
  next();
}

router.use(requireSchoolAdminOrHigher);

router.get('/overview', asyncHandler(getSchoolOverview));
router.get('/teachers', asyncHandler(getTeacherPerformance));
router.get('/students', asyncHandler(getStudentDirectory));
router.get('/exams', asyncHandler(getSchoolExams));
router.get('/learning-outcomes', asyncHandler(getSchoolLearningOutcomes));
router.get('/subject-benchmark', asyncHandler(getSubjectClassBenchmark));

module.exports = router;
