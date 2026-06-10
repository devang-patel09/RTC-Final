const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo',
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const VALID_TRANSITIONS = {
  backlog: ['todo'],
  todo: ['in_progress', 'backlog'],
  in_progress: ['in_review', 'todo'],
  in_review: ['resolved', 'in_progress'],
  resolved: ['closed', 'in_progress'],
  closed: ['resolved'],
};

const bugSchema = new mongoose.Schema({
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
    required: [true, 'Bug title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  stepsToReproduce: {
    type: String,
    trim: true,
  },
  expectedBehavior: {
    type: String,
    trim: true,
  },
  actualBehavior: {
    type: String,
    trim: true,
  },
  environment: {
    type: String,
    trim: true,
  },
  browser: {
    type: String,
    trim: true,
  },
  os: {
    type: String,
    trim: true,
  },
  severity: {
    type: String,
    enum: ['critical', 'major', 'minor', 'trivial'],
    default: 'minor',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  priorityConfidence: {
    type: Number,
    min: 0,
    max: 1,
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'resolved', 'closed'],
    default: 'backlog',
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
  dueDate: Date,
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  labels: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  subtasks: [subtaskSchema],
  attachments: [{
    url: String,
    publicId: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  githubIssue: {
    issueNumber: Number,
    prNumber: Number,
    prMerged: Boolean,
  },
  aiExplanation: {
    rootCause: String,
    impact: String,
    explanation: String,
    recommendedActions: [String],
    generatedAt: Date,
  },
  version: {
    type: Number,
    default: 1,
  },
  aiFixSuggestions: [{
    description: String,
    codeSnippet: String,
    filePath: String,
    preventionTip: String,
    generatedAt: Date,
  }],
}, {
  timestamps: true,
});

bugSchema.index({ project: 1, status: 1 });
bugSchema.index({ assignee: 1 });
bugSchema.index({ project: 1, order: 1 });
bugSchema.index({ labels: 1 });
bugSchema.index({ tags: 1 });
bugSchema.index({ watchers: 1 });

bugSchema.statics.isValidTransition = function(fromStatus, toStatus) {
  const transitions = VALID_TRANSITIONS[fromStatus];
  return transitions ? transitions.includes(toStatus) : false;
};

bugSchema.methods.canTransitionTo = function(toStatus) {
  return this.constructor.isValidTransition(this.status, toStatus);
};

bugSchema.methods.transitionTo = async function(toStatus, userId) {
  if (!this.canTransitionTo(toStatus)) {
    throw new Error(`Cannot transition from '${this.status}' to '${toStatus}'`);
  }
  this.status = toStatus;
  return this.save();
};

module.exports = mongoose.model('Bug', bugSchema);