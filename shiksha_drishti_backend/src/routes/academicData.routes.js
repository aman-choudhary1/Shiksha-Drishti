const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  getAcademicSummary,
  getClasswiseDistribution,
  getDistrictwiseComparison,
  getGenderAnalytics,
  getCategoryAnalytics,
  getResultDistribution,
  getMarksHistogram,
  getSpecialCategoryStats,
  getDistrictRankings,
  getAcademicBundle,
} = require('../controllers/academicData.controller');

// All academic routes require authentication
router.use(authenticate);

// Role guard – All authenticated portal roles can access Academic Analytics
const roleCheck = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
router.use(roleCheck);

router.get('/bundle',        asyncHandler(getAcademicBundle));
router.get('/summary',       asyncHandler(getAcademicSummary));
router.get('/classwise',     asyncHandler(getClasswiseDistribution));
router.get('/districtwise',  asyncHandler(getDistrictwiseComparison));
router.get('/gender',        asyncHandler(getGenderAnalytics));
router.get('/category',      asyncHandler(getCategoryAnalytics));
router.get('/results',       asyncHandler(getResultDistribution));
router.get('/marks',         asyncHandler(getMarksHistogram));
router.get('/special',       asyncHandler(getSpecialCategoryStats));
router.get('/rankings',      asyncHandler(getDistrictRankings));

module.exports = router;
