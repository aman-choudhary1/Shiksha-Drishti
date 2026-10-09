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

// Role guard – STATE_ADMIN, SUPER_ADMIN, and DISTRICT_ADMIN can access
const roleCheck = (req, res, next) => {
  const allowed = ['STATE_ADMIN', 'SUPER_ADMIN', 'DISTRICT_ADMIN', 'PRINCIPAL', 'BLOCK_ADMIN', 'CLUSTER_ADMIN'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied' });
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
