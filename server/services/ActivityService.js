const ActivityLog = require('../models/ActivityLog');

class ActivityService {
  async log(data) {
    return ActivityLog.create(data);
  }

  async getByProject(projectId, query = {}) {
    const filter = { project: projectId };
    if (query.entityType) filter.entityType = query.entityType;
    if (query.action) filter.action = query.action;

    return ActivityLog.find(filter)
      .populate('user', 'fullName email avatar')
      .populate('bug', 'title status')
      .sort({ createdAt: -1 })
      .limit(parseInt(query.limit) || 50);
  }

  async getByBug(bugId) {
    return ActivityLog.find({ bug: bugId })
      .populate('user', 'fullName email avatar')
      .sort({ createdAt: -1 });
  }

  async getRecent(userId, limit = 10) {
    return ActivityLog.find({ user: userId })
      .populate('bug', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new ActivityService();
