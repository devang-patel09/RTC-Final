const mongoose = require('mongoose');
const Bug = require('../models/Bug');
const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const Story = require('../models/Story');
const ActivityLog = require('../models/ActivityLog');

class AnalyticsService {
  _dateFilter(startDate, endDate) {
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    return filter;
  }

  async getProjectAnalytics(projectId, query = {}) {
    const dateFilter = this._dateFilter(query.startDate, query.endDate);
    const baseFilter = { project: new mongoose.Types.ObjectId(projectId), ...dateFilter };

    const totalBugs = await Bug.countDocuments({ project: projectId, ...dateFilter });
    const openBugs = await Bug.countDocuments({
      project: projectId,
      status: { $in: ['backlog', 'todo', 'in_progress', 'in_review'] },
      ...dateFilter,
    });
    const resolvedBugs = await Bug.countDocuments({
      project: projectId,
      status: { $in: ['resolved', 'closed'] },
      ...dateFilter,
    });

    const severityDistribution = await Bug.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const priorityDistribution = await Bug.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const statusDistribution = await Bug.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const bugsByDay = await Bug.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 60 },
    ]);

    const memberWorkload = await Bug.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId), ...dateFilter, assignee: { $ne: null } } },
      {
        $group: {
          _id: '$assignee',
          assigned: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        },
      },
    ]);

    const memberDetails = await User.find({
      _id: { $in: memberWorkload.map(m => m._id) },
    }).select('fullName email avatar');

    const workloadWithNames = memberWorkload.map(m => {
      const user = memberDetails.find(u => u._id.toString() === m._id.toString());
      return { ...m, name: user?.fullName || 'Unknown', avatar: user?.avatar };
    });

    const avgResolutionTime = await Bug.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(projectId),
          status: { $in: ['resolved', 'closed'] },
          ...dateFilter,
        },
      },
      {
        $project: {
          resolutionTime: {
            $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
          },
        },
      },
      { $group: { _id: null, avgDays: { $avg: '$resolutionTime' } } },
    ]);

    return {
      totalBugs,
      openBugs,
      resolvedBugs,
      resolutionRate: totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0,
      severityDistribution,
      priorityDistribution,
      statusDistribution,
      bugsByDay,
      memberWorkload: workloadWithNames,
      avgResolutionTime: Math.round((avgResolutionTime[0]?.avgDays || 0) * 10) / 10,
    };
  }

  async getOrgAnalytics(orgId, query = {}) {
    const projects = await Project.find({ organizationId: orgId }).select('_id title');
    const projectIds = projects.map(p => p._id);
    const dateFilter = this._dateFilter(query.startDate, query.endDate);
    const baseFilter = { project: { $in: projectIds }, ...dateFilter };

    const totalBugs = await Bug.countDocuments({ project: { $in: projectIds }, ...dateFilter });
    const openBugs = await Bug.countDocuments({
      project: { $in: projectIds },
      status: { $in: ['backlog', 'todo', 'in_progress', 'in_review'] },
      ...dateFilter,
    });
    const resolvedBugs = await Bug.countDocuments({
      project: { $in: projectIds },
      status: { $in: ['resolved', 'closed'] },
      ...dateFilter,
    });

    const severityDistribution = await Bug.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const priorityDistribution = await Bug.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const projectDistribution = await Bug.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ]);

    const projectDetails = await Project.find({
      _id: { $in: projectDistribution.map(p => p._id) },
    }).select('title key');

    const projectsWithCounts = projectDistribution.map(p => {
      const proj = projectDetails.find(pd => pd._id.toString() === p._id.toString());
      return { _id: p._id, name: proj?.title || 'Unknown', key: proj?.key, count: p.count };
    });

    const totalMembers = await User.countDocuments({ organizationId: orgId });
    const totalProjects = projects.length;
    const activeSprints = await Sprint.countDocuments({
      project: { $in: projectIds },
      status: 'active',
    });

    return {
      totalBugs,
      openBugs,
      resolvedBugs,
      resolutionRate: totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0,
      totalProjects,
      totalMembers,
      activeSprints,
      severityDistribution,
      priorityDistribution,
      projectDistribution: projectsWithCounts,
    };
  }

  async getUserAnalytics(userId, query = {}) {
    const dateFilter = this._dateFilter(query.startDate, query.endDate);

    const assignedBugs = await Bug.countDocuments({ assignee: userId, ...dateFilter });
    const completedBugs = await Bug.countDocuments({
      assignee: userId,
      status: { $in: ['resolved', 'closed'] },
      ...dateFilter,
    });
    const inProgressBugs = await Bug.countDocuments({
      assignee: userId,
      status: 'in_progress',
    });

    const assignedTasks = await Task.countDocuments({ assignees: userId, ...dateFilter });
    const completedTasks = await Task.countDocuments({
      assignees: userId,
      status: 'done',
      ...dateFilter,
    });

    const recentActivity = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('bug', 'title');

    return {
      assignedBugs,
      completedBugs,
      inProgressBugs,
      assignedTasks,
      completedTasks,
      completionRate: assignedBugs > 0 ? Math.round((completedBugs / assignedBugs) * 100) : 0,
      recentActivity,
    };
  }

  async getSprintAnalytics(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) return null;

    const totalBugs = await Bug.countDocuments({ sprint: sprintId });
    const totalTasks = await Task.countDocuments({ sprint: sprintId });
    const totalStories = await Story.countDocuments({ sprint: sprintId });

    const statusDist = await Bug.aggregate([
      { $match: { sprint: new mongoose.Types.ObjectId(sprintId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const daysTotal = Math.ceil((sprint.endDate - sprint.startDate) / (1000 * 60 * 60 * 24)) || 1;
    const daysElapsed = Math.ceil((new Date() - sprint.startDate) / (1000 * 60 * 60 * 24));

    const resolvedCount = statusDist.find(s => ['resolved', 'closed'].includes(s._id))?.count || 0;
    const remainingBugs = totalBugs - resolvedCount;

    const burndown = await Promise.all(Array.from({ length: Math.min(Math.max(daysElapsed + 1, 1), daysTotal) }, async (_, i) => {
      const date = new Date(sprint.startDate);
      date.setDate(date.getDate() + i);
      const resolvedByDay = await Bug.countDocuments({
        sprint: sprintId,
        status: { $in: ['resolved', 'closed'] },
        updatedAt: { $lte: new Date(date.getTime() + 86400000) },
      });
      return {
        day: i + 1,
        ideal: Math.max(0, totalBugs - (totalBugs / daysTotal) * (i + 1)),
        actual: totalBugs - resolvedByDay,
      };
    }));

    return {
      totalItems: totalBugs + totalTasks + totalStories,
      totalBugs,
      totalTasks,
      totalStories,
      statusDistribution: statusDist,
      completionPercentage: totalBugs > 0 ? Math.round(((totalBugs - remainingBugs) / totalBugs) * 100) : 0,
      burndown,
      daysTotal,
      daysElapsed,
    };
  }
}

module.exports = new AnalyticsService();