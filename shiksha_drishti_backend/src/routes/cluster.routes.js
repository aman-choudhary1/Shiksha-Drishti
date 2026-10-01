const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const {
  getClusterOverview,
  getClusterSchools,
  getClusterSubjects,
  getClusterLearningOutcomes,
  getClusterVisits,
  createClusterVisit,
} = require('../controllers/cluster.controller');

// All cluster routes require authentication
router.use(authenticate);

// CAC, Cluster Coordinator, School Admin, State Admin can view cluster analytics
const clusterRoleCheck = (req, res, next) => {
  const allowed = ['CAC', 'CLUSTER_COORDINATOR', 'SCHOOL_ADMIN', 'STATE_ADMIN', 'SUPER_ADMIN', 'DATA_ANALYST', 'BLOCK_OFFICER'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: Requires Cluster Coordinator or Administrator privileges' });
  }
  next();
};

router.use(clusterRoleCheck);

router.get('/overview', getClusterOverview);
router.get('/schools', getClusterSchools);
router.get('/subjects', getClusterSubjects);
router.get('/learning-outcomes', getClusterLearningOutcomes);
router.get('/visits', getClusterVisits);
router.post('/visits', createClusterVisit);

module.exports = router;
