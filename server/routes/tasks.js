const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, projectAccess, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/task');
const taskController = require('../controllers/taskController');
const { PERMISSIONS } = require('../config/permissions');

router.use(authenticate);
router.use(projectAccess);

router.route('/')
  .post(requirePermission(PERMISSIONS.BUG_CREATE), validate(createTaskSchema), taskController.create)
  .get(taskController.getAll);

router.post('/reorder', requirePermission(PERMISSIONS.BUG_REORDER), taskController.reorder);
router.post('/bulk', requirePermission(PERMISSIONS.BUG_UPDATE), taskController.bulkUpdate);

router.get('/sprint/:sprintId', taskController.getBySprint);

router.route('/:taskId')
  .get(taskController.getById)
  .patch(requirePermission(PERMISSIONS.BUG_UPDATE), validate(updateTaskSchema), taskController.update)
  .delete(requirePermission(PERMISSIONS.BUG_DELETE), taskController.delete);

router.post('/:taskId/watchers', taskController.addWatcher);
router.delete('/:taskId/watchers', taskController.removeWatcher);

module.exports = router;