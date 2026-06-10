const ProjectService = require('../services/ProjectService');

exports.create = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const project = await ProjectService.create(req.validatedBody, req.userId, orgId);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const projects = await ProjectService.getAll(req.userId, req.query);
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const project = await ProjectService.getById(req.params.projectId, req.userId);
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const project = await ProjectService.update(req.params.projectId, req.validatedBody, req.userId);
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await ProjectService.delete(req.params.projectId, req.userId);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getMembers = async (req, res, next) => {
  try {
    const members = await ProjectService.getMembers(req.params.projectId);
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

exports.inviteMember = async (req, res, next) => {
  try {
    const project = await ProjectService.inviteMember(
      req.params.projectId,
      req.body.email,
      req.body.role,
      req.userId
    );
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const project = await ProjectService.removeMember(
      req.params.projectId,
      req.params.memberId,
      req.userId
    );
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const project = await ProjectService.updateMemberRole(
      req.params.projectId,
      req.params.memberId,
      req.body.role,
      req.userId
    );
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};
