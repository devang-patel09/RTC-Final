const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  type: {
    type: String,
    enum: ['explain', 'suggest_fix', 'release_notes', 'auto_priority', 'summary', 'chat', 'chat_stream'],
    required: true,
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
  },
  tokensUsed: Number,
  model: String,
  responseTime: Number,
}, {
  timestamps: true,
});

aiUsageSchema.index({ user: 1, createdAt: -1 });
aiUsageSchema.index({ organization: 1, createdAt: -1 });
aiUsageSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('AiUsage', aiUsageSchema);