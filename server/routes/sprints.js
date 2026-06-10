const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, projectAccess } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSprintSchema, updateSprintSchema } = require('../validators/sprint');
const sprintController = require('../controllers/sprintController');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);
router.use(projectAccess);

router.route('/')
  .post(validate(createSprintSchema), sprintController.create)
  .get(sprintController.getAll);

router.route('/:sprintId')
  .get(sprintController.getById)
  .patch(validate(updateSprintSchema), sprintController.update);

router.post('/:sprintId/start', sprintController.start);
router.post('/:sprintId/complete', sprintController.complete);
router.post('/:sprintId/cancel', sprintController.cancel);
router.get('/:sprintId/stats', sprintController.getStats);
router.get('/:sprintId/analytics', analyticsController.getSprintAnalytics);

module.exports = router;
