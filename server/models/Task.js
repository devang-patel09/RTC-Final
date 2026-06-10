const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  type: {
    type: String,
    enum: ['task', 'story', 'subtask'],
    default: 'task',
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
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  storyPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  dueDate: Date,
  labels: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  completedAt: Date,
}, {
  timestamps: true,
});

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, sprint: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ parentTask: 1 });

module.exports = mongoose.model('Task', taskSchema);