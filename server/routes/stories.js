const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, projectAccess, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createStorySchema, updateStorySchema } = require('../validators/story');
const storyController = require('../controllers/storyController');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticate);
router.use(projectAccess);

router.route('/')
  .post(requirePermission(PERMISSIONS.BUG_CREATE), validate(createStorySchema), storyController.create)
  .get(storyController.getAll);

router.post('/reorder', requirePermission(PERMISSIONS.BUG_REORDER), storyController.reorder);

router.get('/sprint/:sprintId', storyController.getBySprint);

router.route('/:storyId')
  .get(storyController.getById)
  .patch(requirePermission(PERMISSIONS.BUG_UPDATE), validate(updateStorySchema), storyController.update)
  .delete(requirePermission(PERMISSIONS.BUG_DELETE), storyController.delete);

router.patch('/:storyId/criteria/:criteriaId', requirePermission(PERMISSIONS.BUG_UPDATE), storyController.updateAcceptanceCriteria);

router.post('/:storyId/watchers', storyController.addWatcher);
router.delete('/:storyId/watchers', storyController.removeWatcher);

module.exports = router;