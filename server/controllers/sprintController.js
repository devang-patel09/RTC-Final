const SprintService = require('../services/SprintService');

exports.create = async (req, res, next) => {
  try {
    const sprint = await SprintService.create({ ...req.validatedBody, project: req.params.projectId }, req.userId);
    res.status(201).json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const sprints = await SprintService.getAll(req.params.projectId);
    res.json({ success: true, data: sprints });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await SprintService.getById(req.params.sprintId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const sprint = await SprintService.update(req.params.sprintId, req.validatedBody);
    res.json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

exports.start = async (req, res, next) => {
  try {
    const sprint = await SprintService.start(req.params.sprintId);
    res.json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

exports.complete = async (req, res, next) => {
  try {
    const sprint = await SprintService.complete(req.params.sprintId);
    res.json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const sprint = await SprintService.cancel(req.params.sprintId);
    res.json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await SprintService.getSprintStats(req.params.sprintId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
