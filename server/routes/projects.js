const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, projectAccess, projectAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema } = require('../validators/project');
const projectController = require('../controllers/projectController');
const bugRoutes = require('./bugs');
const sprintRoutes = require('./sprints');
const taskRoutes = require('./tasks');
const storyRoutes = require('./stories');
const analyticsController = require('../controllers/analyticsController');
const activityController = require('../controllers/activityController');

router.use(authenticate);

router.route('/')
  .post(validate(createProjectSchema), projectController.create)
  .get(projectController.getAll);

router.route('/:projectId')
  .get(projectAccess, projectController.getById)
  .patch(projectAccess, validate(updateProjectSchema), projectController.update)
  .delete(projectAccess, projectAdmin, projectController.delete);

router.get('/:projectId/members', projectAccess, projectController.getMembers);
router.post('/:projectId/members/invite', projectAccess, projectAdmin, projectController.inviteMember);
router.delete('/:projectId/members/:memberId', projectAccess, projectAdmin, projectController.removeMember);
router.patch('/:projectId/members/:memberId/role', projectAccess, projectAdmin, projectController.updateMemberRole);

router.get('/:projectId/analytics', projectAccess, analyticsController.getProjectAnalytics);
router.get('/:projectId/activity', projectAccess, activityController.getByProject);

router.use('/:projectId/bugs', bugRoutes);
router.use('/:projectId/sprints', sprintRoutes);
router.use('/:projectId/tasks', taskRoutes);
router.use('/:projectId/stories', storyRoutes);

module.exports = router;
