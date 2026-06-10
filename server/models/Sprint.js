const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true,
  },
  goal: {
    type: String,
    trim: true,
    maxlength: [500, 'Goal cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  capacity: {
    type: Number,
    default: 0,
    min: 0,
  },
  capacityUnit: {
    type: String,
    enum: ['hours', 'story_points', 'bug_count'],
    default: 'hours',
  },
  velocity: {
    type: Number,
    default: 0,
  },
  averageVelocity: {
    type: Number,
    default: 0,
  },
  goals: [{
    description: String,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  }],
  retrospective: {
    whatWentWell: [String],
    whatCanImprove: [String],
    actionItems: [String],
  },
}, {
  timestamps: true,
});

sprintSchema.index({ project: 1, status: 1 });
sprintSchema.index({ project: 1, startDate: -1 });

module.exports = mongoose.model('Sprint', sprintSchema);