const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const { authorizeAssessmentAccess } = require('../middleware/authorize');
const {
  listAssessments, createAssessment, getAssessment,
  updateAssessment, getAssessmentStatus, submitAssessment,
  getAssessmentAnalytics,
} = require('../controllers/assessment.controller');
const { getSubjectMarks, bulkSaveSubjectMarks } = require('../controllers/subjectMarks.controller');
const { getQuestionMarks, bulkSaveQuestionMarks } = require('../controllers/questionMarks.controller');

router.use(authenticate);

// Assessment CRUD
router.get('/', asyncHandler(listAssessments));
router.post('/', asyncHandler(createAssessment));
router.get('/:assessmentId', authorizeAssessmentAccess, asyncHandler(getAssessment));
router.patch('/:assessmentId', authorizeAssessmentAccess, asyncHandler(updateAssessment));
router.get('/:assessmentId/status', authorizeAssessmentAccess, asyncHandler(getAssessmentStatus));
router.get('/:assessmentId/analytics', authorizeAssessmentAccess, asyncHandler(getAssessmentAnalytics));
router.post('/:assessmentId/submit', authorizeAssessmentAccess, asyncHandler(submitAssessment));

// Subject Marks (Class Report Card — MODE A)
router.get('/:assessmentId/subject-marks', authorizeAssessmentAccess, asyncHandler(getSubjectMarks));
router.post('/:assessmentId/subject-marks/bulk', authorizeAssessmentAccess, asyncHandler(bulkSaveSubjectMarks));

// Question Marks (MODE B — question-wise)
router.get('/:assessmentId/question-marks', authorizeAssessmentAccess, asyncHandler(getQuestionMarks));
router.post('/:assessmentId/question-marks/bulk', authorizeAssessmentAccess, asyncHandler(bulkSaveQuestionMarks));

module.exports = router;
