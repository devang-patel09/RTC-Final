const mongoose = require('mongoose');

const acceptanceCriteriaSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  satisfied: {
    type: Boolean,
    default: false,
  },
});

const storySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
  },
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'],
    default: 'backlog',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  order: {
    type: Number,
    default: 0,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  storyPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  acceptanceCriteria: [acceptanceCriteriaSchema],
  labels: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  dependencies: [{
    dependsOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by', 'related'],
      default: 'blocked_by',
    },
  }],
}, {
  timestamps: true,
});

storySchema.index({ project: 1, status: 1 });
storySchema.index({ project: 1, sprint: 1 });
storySchema.index({ assignee: 1 });

module.exports = mongoose.model('Story', storySchema);