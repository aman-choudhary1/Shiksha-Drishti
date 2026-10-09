const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/assessmentQuestionBank.controller');

// Ensure destination directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/questions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, 'qimg-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, webp, svg) are allowed!'));
  },
});

// 1. Papers
router.get('/papers', controller.getAllPapers);
router.get('/papers/:paperCode', controller.getPaperByCode);
router.post('/papers', controller.savePaper);

// 2. Questions & Options
router.post('/questions', controller.saveQuestion);
router.delete('/questions/:id', controller.deleteQuestion);

// 3. Image Upload
router.post('/upload-image', upload.single('image'), controller.uploadImage);

// 4. Quick Seed Endpoint for SLA Paper 1021
router.post('/seed-sla-1021', controller.seedSlaPaper1021);

// 5. Mobile App Test Submission
router.post('/submit', controller.submitAssessment);

module.exports = router;
