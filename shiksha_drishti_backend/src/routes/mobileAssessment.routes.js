const express = require('express');
const router = express.Router();
const controller = require('../controllers/mobileAssessment.controller');

// 1. Get all available papers / student menu
router.get('/papers', controller.getMobilePapers);
router.get('/student-menu', controller.getStudentMenu);

// 2. Fetch questions by Class & Subject (No PaperCode needed!)
// Examples:
// - GET /api/mobile/assessments/paper?class=1&subject=Hindi
// - GET /api/mobile/assessments/paper/class/1/subject/Hindi
// - GET /api/mobile/assessments/paper/1011
router.get('/paper/class/:classNo/subject/:subject', controller.getMobilePaperByCode);
router.get('/paper', controller.getMobilePaperByCode);
router.get('/paper/:paperCode', controller.getMobilePaperByCode);

// 3. Submit mobile student assessment & auto-grade
router.post('/submit', controller.submitMobileAssessment);

// 4. Bulk import assessment JSON
router.post('/import-json', controller.importMobileJson);

// 5. Quick seed Hindi Paper 1011
router.post('/seed-hindi-1011', controller.seedHindiPaper1011);

module.exports = router;
