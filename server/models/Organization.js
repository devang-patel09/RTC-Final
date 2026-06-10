const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  logo: {
    type: String,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'starter', 'business', 'enterprise'],
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'active',
  },
  trialEndsAt: Date,
  subscriptionId: String,
  billingEmail: String,
  maxProjects: {
    type: Number,
    default: 5,
  },
  maxMembers: {
    type: Number,
    default: 10,
  },
  maxStorage: {
    type: Number,
    default: 100,
  },
  features: {
    aiEnabled: { type: Boolean, default: true },
    githubEnabled: { type: Boolean, default: true },
    analyticsEnabled: { type: Boolean, default: true },
    apiAccess: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

organizationSchema.index({ slug: 1 });
organizationSchema.index({ owner: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
