const mongoose = require('mongoose');

const githubIntegrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  githubInstallationId: String,
  githubRepoId: String,
  repoFullName: String,
  repoUrl: String,
  accessToken: String,
  webhookSecret: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  linkedPRs: [{
    prNumber: Number,
    prTitle: String,
    prUrl: String,
    bugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bug',
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'merged'],
    },
    mergedAt: Date,
  }],
}, {
  timestamps: true,
});

githubIntegrationSchema.index({ user: 1, project: 1 });

module.exports = mongoose.model('GithubIntegration', githubIntegrationSchema);
