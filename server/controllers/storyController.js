const StoryService = require('../services/StoryService');

exports.create = async (req, res, next) => {
  try {
    const story = await StoryService.create({ ...req.validatedBody, project: req.params.projectId }, req.userId);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('story_created', story);
    res.status(201).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const stories = await StoryService.getAll(req.params.projectId, req.query);
    res.json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const story = await StoryService.getById(req.params.storyId);
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const story = await StoryService.update(req.params.storyId, req.validatedBody, req.userId);
    req.app.get('io').to(`project:${story.project}`).emit('story_updated', story);
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const story = await StoryService.getById(req.params.storyId);
    await StoryService.delete(req.params.storyId, req.userId);
    req.app.get('io').to(`project:${story.project}`).emit('story_deleted', { project: story.project, id: req.params.storyId });
    res.json({ success: true, message: 'Story deleted' });
  } catch (error) {
    next(error);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    await StoryService.reorder(req.params.projectId, req.body.orderedIds);
    res.json({ success: true, message: 'Stories reordered' });
  } catch (error) {
    next(error);
  }
};

exports.getBySprint = async (req, res, next) => {
  try {
    const stories = await StoryService.getBySprint(req.params.sprintId);
    res.json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
};

exports.updateAcceptanceCriteria = async (req, res, next) => {
  try {
    const story = await StoryService.updateAcceptanceCriteria(req.params.storyId, req.params.criteriaId, req.body, req.userId);
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.addWatcher = async (req, res, next) => {
  try {
    const story = await StoryService.addWatcher(req.params.storyId, req.userId);
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

exports.removeWatcher = async (req, res, next) => {
  try {
    const story = await StoryService.removeWatcher(req.params.storyId, req.userId);
    res.json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};