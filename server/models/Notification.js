const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'assignment',
      'unassignment',
      'comment',
      'status_change',
      'deadline_reminder',
      'mention',
      'invitation',
      'bug_created',
      'bug_deleted',
      'sprint_started',
      'sprint_completed',
      'role_change',
      'github_event',
      'ai_action',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    projectId: String,
    bugId: String,
    commentId: String,
    sprintId: String,
    organizationId: String,
    actorId: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  isArchived: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isArchived: 1, createdAt: -1 });
notificationSchema.index({ 'data.bugId': 1 });

module.exports = mongoose.model('Notification', notificationSchema);