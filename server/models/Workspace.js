const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['personal', 'organization'],
    default: 'personal',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
}, {
  timestamps: true,
});

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
