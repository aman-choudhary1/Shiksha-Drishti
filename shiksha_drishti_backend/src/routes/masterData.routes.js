const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const {
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
} = require('../controllers/masterData.controller');

router.use(authenticate);

router.get('/classes', asyncHandler(getClasses));
router.get('/schools/:udise', asyncHandler(getSchool));
router.get('/classes/:classId/students', asyncHandler(getClassStudents));
router.get('/academic-years', asyncHandler(getAcademicYears));
router.get('/subjects', asyncHandler(getSubjects));
router.get('/questions', asyncHandler(getQuestions));
router.get('/learning-outcomes', asyncHandler(getLearningOutcomes));

// Master Administrative Hierarchy routes
router.get('/master/districts', asyncHandler(getDistricts));
router.get('/master/blocks', asyncHandler(getBlocks));
router.get('/master/clusters', asyncHandler(getClusters));
router.get('/master/schools', asyncHandler(getSchoolsList));

// Short alias routes
router.get('/districts', asyncHandler(getDistricts));
router.get('/blocks', asyncHandler(getBlocks));
router.get('/clusters', asyncHandler(getClusters));

module.exports = router;

