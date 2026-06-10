const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/user', analyticsController.getUserAnalytics);
router.get('/org', analyticsController.getOrgAnalytics);
router.get('/org/:orgId', analyticsController.getOrgAnalytics);

module.exports = router;