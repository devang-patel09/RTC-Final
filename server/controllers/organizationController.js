const OrganizationService = require('../services/OrganizationService');
const { ROLES } = require('../config/permissions');

exports.getMyOrg = async (req, res, next) => {
  try {
    const org = await OrganizationService.getByUser(req.userId);
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const org = await OrganizationService.create(req.body, req.userId);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

exports.updateMyOrg = async (req, res, next) => {
  try {
    const org = await OrganizationService.update(req.user.organizationId, req.body, req.userId);
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const org = await OrganizationService.getById(req.params.organizationId);
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const org = await OrganizationService.update(req.params.organizationId, req.body, req.userId);
    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrg = async (req, res, next) => {
  try {
    await OrganizationService.delete(req.params.organizationId, req.userId);
    res.json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    const members = await OrganizationService.getMembers(req.user.organizationId);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

exports.getMembersById = async (req, res, next) => {
  try {
    const members = await OrganizationService.getMembers(req.params.organizationId);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const member = await OrganizationService.updateMemberRole(
      req.user.organizationId,
      req.params.memberId,
      req.body.role,
      req.userId
    );
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    await OrganizationService.removeMember(req.user.organizationId, req.params.memberId, req.userId);
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

exports.invite = async (req, res, next) => {
  try {
    const invite = await OrganizationService.inviteMember(req.user.organizationId, req.body, req.userId);
    res.status(201).json({ success: true, data: invite });
  } catch (error) {
    next(error);
  }
};

exports.resendInvite = async (req, res, next) => {
  try {
    const invite = await OrganizationService.resendInvite(req.user.organizationId, req.params.inviteId);
    res.json({ success: true, data: invite });
  } catch (error) {
    next(error);
  }
};

exports.revokeInvite = async (req, res, next) => {
  try {
    const invite = await OrganizationService.revokeInvite(req.user.organizationId, req.params.inviteId);
    res.json({ success: true, data: invite });
  } catch (error) {
    next(error);
  }
};

exports.getInvites = async (req, res, next) => {
  try {
    const invites = await OrganizationService.getInvites(req.user.organizationId);
    res.json({ success: true, data: invites });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await OrganizationService.getStats(req.user.organizationId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};