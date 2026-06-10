const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.use(authenticate);

router.post('/explain', aiController.explainBug);
router.post('/suggest-fix', aiController.suggestFix);
router.post('/release-notes', aiController.generateReleaseNotes);
router.post('/auto-priority', aiController.detectPriority);
router.post('/summary', aiController.generateSummary);
router.post('/chat', aiController.chat);
router.get('/chat/stream', aiController.chatStream);
router.get('/usage', aiController.getUsage);
router.get('/cache/stats', aiController.getCacheStats);
router.post('/cache/clear', aiController.clearCache);

module.exports = router;
