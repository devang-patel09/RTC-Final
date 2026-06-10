const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createUser = (overrides = {}) => ({
  _id: overrides._id || new mongoose.Types.ObjectId(),
  fullName: overrides.fullName || 'Test User',
  email: overrides.email || `test${Date.now()}@example.com`,
  password: bcrypt.hashSync('password123', 10),
  role: overrides.role || 'developer',
  organizationId: overrides.organizationId || new mongoose.Types.ObjectId(),
  isEmailVerified: overrides.isEmailVerified ?? true,
  ...overrides,
});

const createProject = (overrides = {}) => ({
  _id: overrides._id || new mongoose.Types.ObjectId(),
  title: overrides.title || 'Test Project',
  key: overrides.key || 'TEST',
  description: overrides.description || 'A test project',
  organizationId: overrides.organizationId || new mongoose.Types.ObjectId(),
  members: overrides.members || [],
  createdBy: overrides.createdBy || new mongoose.Types.ObjectId(),
  ...overrides,
});

const createBug = (overrides = {}) => ({
  title: overrides.title || 'Test Bug',
  description: overrides.description || 'A test bug',
  status: overrides.status || 'open',
  priority: overrides.priority || 'medium',
  severity: overrides.severity || 'minor',
  project: overrides.project || new mongoose.Types.ObjectId(),
  organizationId: overrides.organizationId || new mongoose.Types.ObjectId(),
  reportedBy: overrides.reportedBy || new mongoose.Types.ObjectId(),
  assignee: overrides.assignee || null,
  version: 1,
  ...overrides,
});

module.exports = { createUser, createProject, createBug };