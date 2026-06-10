const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, projectAccess, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createBugSchema, updateBugSchema } = require('../validators/bug');
const bugController = require('../controllers/bugController');
const commentRoutes = require('./comments');
const upload = require('../middleware/upload');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticate);
router.use(projectAccess);

router.route('/')
  .post(requirePermission(PERMISSIONS.BUG_CREATE), validate(createBugSchema), bugController.create)
  .get(bugController.getAll);

router.post('/reorder', requirePermission(PERMISSIONS.BUG_REORDER), bugController.reorder);
router.post('/bulk', requirePermission(PERMISSIONS.BUG_UPDATE), bugController.bulkUpdate);

router.get('/labels', bugController.getLabels);
router.get('/tags', bugController.getTags);

router.route('/:bugId')
  .get(bugController.getById)
  .patch(requirePermission(PERMISSIONS.BUG_UPDATE), validate(updateBugSchema), bugController.update)
  .delete(requirePermission(PERMISSIONS.BUG_DELETE), bugController.delete);

router.post('/:bugId/attachments', requirePermission(PERMISSIONS.BUG_UPDATE), upload.single('file'), bugController.addAttachment);
router.delete('/:bugId/attachments/:attachmentId', requirePermission(PERMISSIONS.BUG_DELETE), bugController.removeAttachment);

router.post('/:bugId/ai/explain', requirePermission(PERMISSIONS.AI_USE), bugController.explainWithAI);
router.post('/:bugId/ai/suggest-fix', requirePermission(PERMISSIONS.AI_USE), bugController.suggestFixWithAI);
router.post('/:bugId/ai/detect-priority', requirePermission(PERMISSIONS.AI_USE), bugController.detectPriority);

router.post('/:bugId/subtasks', requirePermission(PERMISSIONS.BUG_UPDATE), bugController.addSubtask);
router.patch('/:bugId/subtasks/:subtaskId', requirePermission(PERMISSIONS.BUG_UPDATE), bugController.updateSubtask);
router.delete('/:bugId/subtasks/:subtaskId', requirePermission(PERMISSIONS.BUG_DELETE), bugController.deleteSubtask);

router.post('/:bugId/watchers', bugController.addWatcher);
router.delete('/:bugId/watchers', bugController.removeWatcher);

router.post('/:bugId/labels', requirePermission(PERMISSIONS.BUG_UPDATE), bugController.addLabel);
router.delete('/:bugId/labels/:label', requirePermission(PERMISSIONS.BUG_UPDATE), bugController.removeLabel);

router.use('/:bugId/comments', commentRoutes);

module.exports = router;