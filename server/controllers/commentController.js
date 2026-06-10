const CommentService = require('../services/CommentService');

exports.create = async (req, res, next) => {
  try {
    const comment = await CommentService.create(req.params.bugId, req.validatedBody, req.userId);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('comment_created', comment);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

exports.getByBug = async (req, res, next) => {
  try {
    const comments = await CommentService.getByBug(req.params.bugId);
    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const comment = await CommentService.update(req.params.commentId, req.validatedBody.body, req.userId);
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await CommentService.delete(req.params.commentId, req.userId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

exports.addReaction = async (req, res, next) => {
  try {
    const comment = await CommentService.addReaction(req.params.commentId, req.body.emoji, req.userId);
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

exports.removeReaction = async (req, res, next) => {
  try {
    const comment = await CommentService.removeReaction(req.params.commentId, req.params.emoji, req.userId);
    res.json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};
