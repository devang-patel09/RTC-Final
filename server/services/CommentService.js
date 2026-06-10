const Comment = require('../models/Comment');
const Bug = require('../models/Bug');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/errors');

class CommentService {
  async create(bugId, data, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    const comment = await Comment.create({
      bug: bugId,
      author: userId,
      body: data.body,
      parentComment: data.parentComment,
      mentions: data.mentions || [],
    });

    await ActivityLog.create({
      project: bug.project,
      bug: bugId,
      user: userId,
      action: 'comment_added',
      entityType: 'comment',
      entityId: comment._id,
    });

    if (data.parentComment) {
      const parent = await Comment.findById(data.parentComment);
      if (parent && parent.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: parent.author,
          type: 'comment',
          title: 'New reply',
          message: `${bug.title}`,
          data: { projectId: bug.project, bugId, commentId: comment._id.toString() },
        });
      }
    }

    if (data.mentions && data.mentions.length > 0) {
      for (const mentionId of data.mentions) {
        if (mentionId !== userId.toString()) {
          await Notification.create({
            recipient: mentionId,
            type: 'mention',
            title: 'You were mentioned',
            message: `You were mentioned in a comment on bug: ${bug.title}`,
            data: { projectId: bug.project, bugId, commentId: comment._id.toString() },
          });
        }
      }
    }

    if (bug.assignee && bug.assignee.toString() !== userId.toString()) {
      const alreadyNotified = data.mentions?.some(m => m.toString() === bug.assignee.toString());
      if (!alreadyNotified) {
        await Notification.create({
          recipient: bug.assignee,
          type: 'comment',
          title: 'New Comment',
          message: `New comment on bug: ${bug.title}`,
          data: { projectId: bug.project, bugId, commentId: comment._id.toString() },
        });
      }
    }

    return comment.populate('author', 'fullName email avatar');
  }

  async getByBug(bugId) {
    const comments = await Comment.find({ bug: bugId })
      .populate('author', 'fullName email avatar')
      .populate('reactions.user', 'fullName email avatar')
      .sort({ createdAt: 1 });
    return comments;
  }

  async update(commentId, body, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.author.toString() !== userId.toString()) {
      throw new AppError('Not authorized to edit this comment', 403);
    }

    comment.editHistory.push({ body: comment.body, editedAt: new Date() });
    comment.body = body;
    comment.isEdited = true;
    await comment.save();

    return comment.populate('author', 'fullName email avatar');
  }

  async delete(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.author.toString() !== userId.toString()) {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    await Comment.deleteMany({ parentComment: commentId });
    await Comment.findByIdAndDelete(commentId);
  }

  async addReaction(commentId, emoji, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    const existing = comment.reactions.find(r => r.emoji === emoji && r.user.toString() === userId.toString());
    if (existing) return comment.populate('reactions.user', 'fullName email avatar');

    comment.reactions.push({ emoji, user: userId });
    await comment.save();
    return comment.populate('reactions.user', 'fullName email avatar');
  }

  async removeReaction(commentId, emoji, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found', 404);

    comment.reactions = comment.reactions.filter(
      r => !(r.emoji === emoji && r.user.toString() === userId.toString())
    );
    await comment.save();
    return comment.populate('reactions.user', 'fullName email avatar');
  }
}

module.exports = new CommentService();