const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  getStateOverview,
  getStateDistricts,
  getStateQuestionAnalytics,
  getStateTeacherMatrix,
  getStateStudentPerformance,
} = require('../controllers/state.controller');

// All state routes require authentication
router.use(authenticate);

// Only STATE_ADMIN and SUPER_ADMIN can access state-level analytics
const stateRoleCheck = (req, res, next) => {
  const allowed = ['STATE_ADMIN', 'SUPER_ADMIN'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: State Administrator privileges required' });
  }
  next();
};

router.use(stateRoleCheck);

router.get('/overview',   getStateOverview);
router.get('/districts',  getStateDistricts);
router.get('/questions',  getStateQuestionAnalytics);
router.get('/teachers',   getStateTeacherMatrix);
router.get('/students',   asyncHandler(getStateStudentPerformance));

module.exports = router;
