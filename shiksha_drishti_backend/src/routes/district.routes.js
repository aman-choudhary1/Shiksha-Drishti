const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getDistrictOverview,
  getDistrictSchools,
  getDistrictQuestionAnalytics,
  getDistrictFacultyMatrix,
} = require('../controllers/district.controller');

// All district routes require authentication
router.use(authenticate);

// District Officer, DEO, State Admin, Block Officer can view district analytics
const districtRoleCheck = (req, res, next) => {
  const allowed = ['DISTRICT_OFFICER', 'DEO', 'STATE_ADMIN', 'SUPER_ADMIN', 'DATA_ANALYST', 'BLOCK_OFFICER'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: Requires District Officer or Administrator privileges' });
  }
  next();
};

router.use(districtRoleCheck);

router.get('/overview', getDistrictOverview);
router.get('/schools', getDistrictSchools);
router.get('/questions', getDistrictQuestionAnalytics);
router.get('/faculty', getDistrictFacultyMatrix);

module.exports = router;
