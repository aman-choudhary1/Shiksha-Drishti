const express = require('express');
const router = express.Router();
const controller = require('../controllers/mobileAssessment.controller');
const { optionalAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER MOBILE MOCK TEST 3-STEP SELECTION WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

// Step 1: Class list of school whose teacher is logged in
// Examples:
// - GET /api/mobile/assessments/classes (with Bearer Token)
// - GET /api/mobile/assessments/classes?school_udise=22050904705
// - GET /api/mobile/assessments/classes?teacher_id=2
router.get('/classes', optionalAuth, controller.getTeacherSchoolClasses);
router.get('/teacher/classes', optionalAuth, controller.getTeacherSchoolClasses);
router.get('/school-classes', optionalAuth, controller.getTeacherSchoolClasses);

// Step 2: Students list of selected class
// Examples:
// - GET /api/mobile/assessments/students?class=1
// - GET /api/mobile/assessments/students?class=1&search=Aarav
// - GET /api/mobile/assessments/classes/1/students
// - GET /api/mobile/assessments/class/1/students
router.get('/students', optionalAuth, controller.getClassStudents);
router.get('/classes/:classId/students', optionalAuth, controller.getClassStudents);
router.get('/class/:classNo/students', optionalAuth, controller.getClassStudents);

// Step 3: Subject list of selected class
// Examples:
// - GET /api/mobile/assessments/subjects?class=1
// - GET /api/mobile/assessments/classes/1/subjects
// - GET /api/mobile/assessments/class/1/subjects
router.get('/subjects', controller.getClassSubjects);
router.get('/classes/:classId/subjects', controller.getClassSubjects);
router.get('/class/:classNo/subjects', controller.getClassSubjects);

// ═══════════════════════════════════════════════════════════════════════════
// QUESTIONS & ASSESSMENT PAPERS (Existing APIs)
// ═══════════════════════════════════════════════════════════════════════════

// Step 4: Fetch questions by Class & Subject OR PaperCode (which api we make before)
// Examples:
// - GET /api/mobile/assessments/paper?class=1&subject=Hindi
// - GET /api/mobile/assessments/paper?class=1&subject=Mathematics
// - GET /api/mobile/assessments/paper/class/1/subject/Hindi
// - GET /api/mobile/assessments/paper/1011
router.get('/paper/class/:classNo/subject/:subject', controller.getMobilePaperByCode);
router.get('/paper', controller.getMobilePaperByCode);
router.get('/paper/:paperCode', controller.getMobilePaperByCode);

// Papers & student menu catalogue
router.get('/papers', controller.getMobilePapers);
router.get('/student-menu', controller.getStudentMenu);

// Submit mobile student assessment & auto-grade
router.post('/submit', controller.submitMobileAssessment);

// Bulk import assessment JSON & seed
router.post('/import-json', controller.importMobileJson);
router.post('/seed-hindi-1011', controller.seedHindiPaper1011);

module.exports = router;
