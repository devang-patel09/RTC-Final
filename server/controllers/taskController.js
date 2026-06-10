const TaskService = require('../services/TaskService');

exports.create = async (req, res, next) => {
  try {
    const task = await TaskService.create({ ...req.validatedBody, project: req.params.projectId }, req.userId);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('task_created', task);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const tasks = await TaskService.getAll(req.params.projectId, req.query);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const task = await TaskService.getById(req.params.taskId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const task = await TaskService.update(req.params.taskId, req.validatedBody, req.userId);
    req.app.get('io').to(`project:${task.project}`).emit('task_updated', task);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const task = await TaskService.getById(req.params.taskId);
    await TaskService.delete(req.params.taskId, req.userId);
    req.app.get('io').to(`project:${task.project}`).emit('task_deleted', { project: task.project, id: req.params.taskId });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    await TaskService.reorder(req.params.projectId, req.body.orderedIds);
    res.json({ success: true, message: 'Tasks reordered' });
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdate = async (req, res, next) => {
  try {
    const { taskIds, data } = req.body;
    const results = await TaskService.bulkUpdate(req.params.projectId, taskIds, data, req.userId);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

exports.getBySprint = async (req, res, next) => {
  try {
    const tasks = await TaskService.getBySprint(req.params.sprintId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.addWatcher = async (req, res, next) => {
  try {
    const task = await TaskService.addWatcher(req.params.taskId, req.userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.removeWatcher = async (req, res, next) => {
  try {
    const task = await TaskService.removeWatcher(req.params.taskId, req.userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};