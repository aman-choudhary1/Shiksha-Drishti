const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
  getBlockOverview,
  getBlockClusters,
  getBlockSchools,
  getBlockQuestionAnalytics,
  getBlockFacultyMatrix,
} = require('../controllers/block.controller');

// All block routes require authentication
router.use(authenticate);

// Block Officer, BEO, District Officer, DEO, State Admin can view block analytics
const blockRoleCheck = (req, res, next) => {
  const allowed = ['BLOCK_OFFICER', 'BEO', 'DISTRICT_OFFICER', 'DEO', 'STATE_ADMIN', 'SUPER_ADMIN', 'DATA_ANALYST'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: Requires Block Officer or Administrator privileges' });
  }
  next();
};

router.use(blockRoleCheck);

router.get('/overview', getBlockOverview);
router.get('/clusters', getBlockClusters);
router.get('/schools', getBlockSchools);
router.get('/questions', getBlockQuestionAnalytics);
router.get('/faculty', getBlockFacultyMatrix);

module.exports = router;
