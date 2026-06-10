const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  bug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    enum: ['bug', 'project', 'sprint', 'comment', 'user', 'task', 'story'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ bug: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
