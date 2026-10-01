const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth');
const {
  getSchool, getClassStudents, getAcademicYears, getSubjects, getQuestions, getLearningOutcomes, getClasses,
} = require('../controllers/masterData.controller');

router.use(authenticate);

router.get('/classes', asyncHandler(getClasses));
router.get('/schools/:udise', asyncHandler(getSchool));
router.get('/classes/:classId/students', asyncHandler(getClassStudents));
router.get('/academic-years', asyncHandler(getAcademicYears));
router.get('/subjects', asyncHandler(getSubjects));
router.get('/questions', asyncHandler(getQuestions));
router.get('/learning-outcomes', asyncHandler(getLearningOutcomes));

module.exports = router;

