const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');
const orgController = require('../controllers/organizationController');

router.use(authenticate);

router.post('/', requirePermission(PERMISSIONS.ORG_UPDATE), orgController.create);

router.get('/me', orgController.getMyOrg);
router.patch('/me', requirePermission(PERMISSIONS.ORG_UPDATE), orgController.updateMyOrg);
router.get('/me/members', requirePermission(PERMISSIONS.USER_VIEW), orgController.getMembers);
router.patch('/me/members/:memberId', requirePermission(PERMISSIONS.USER_ROLE_CHANGE), orgController.updateMemberRole);
router.delete('/me/members/:memberId', requirePermission(PERMISSIONS.USER_REMOVE), orgController.removeMember);

router.post('/me/invite', requirePermission(PERMISSIONS.USER_INVITE), orgController.invite);
router.get('/me/invites', requirePermission(PERMISSIONS.USER_VIEW), orgController.getInvites);
router.post('/me/invites/:inviteId/resend', requirePermission(PERMISSIONS.USER_INVITE), orgController.resendInvite);
router.patch('/me/invites/:inviteId/revoke', requirePermission(PERMISSIONS.USER_INVITE), orgController.revokeInvite);

router.get('/me/stats', orgController.getStats);

router.get('/:organizationId', requirePermission(PERMISSIONS.SUPER_ADMIN), orgController.getById);
router.patch('/:organizationId', requirePermission(PERMISSIONS.SUPER_ADMIN), orgController.update);
router.delete('/:organizationId', requirePermission(PERMISSIONS.SUPER_ADMIN), orgController.deleteOrg);
router.get('/:organizationId/members', requirePermission(PERMISSIONS.SUPER_ADMIN), orgController.getMembersById);

module.exports = router;