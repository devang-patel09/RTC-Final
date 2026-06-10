const Sprint = require('../models/Sprint');
const Bug = require('../models/Bug');
const Task = require('../models/Task');
const Story = require('../models/Story');
const { AppError } = require('../utils/errors');

class SprintService {
  async create(data, userId) {
    if (data.startDate >= data.endDate) {
      throw new AppError('End date must be after start date', 400);
    }

    const sprint = await Sprint.create({
      ...data,
      createdBy: userId,
    });
    return sprint;
  }

  async getAll(projectId) {
    return Sprint.find({ project: projectId })
      .sort({ startDate: -1 });
  }

  async getById(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    const bugs = await Bug.find({ sprint: sprintId })
      .populate('reporter assignee', 'fullName email avatar')
      .sort({ order: 1 });

    const tasks = await Task.find({ sprint: sprintId })
      .populate('reporter assignee', 'fullName email avatar')
      .sort({ order: 1 });

    const stories = await Story.find({ sprint: sprintId })
      .populate('reporter assignee', 'fullName email avatar')
      .sort({ order: 1 });

    return { sprint, bugs, tasks, stories };
  }

  async update(sprintId, data) {
    const sprint = await Sprint.findByIdAndUpdate(sprintId, data, { new: true, runValidators: true });
    if (!sprint) throw new AppError('Sprint not found', 404);
    return sprint;
  }

  async start(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);
    if (sprint.status !== 'planned') {
      throw new AppError('Sprint can only be started from planned status', 400);
    }

    const activeSprint = await Sprint.findOne({
      project: sprint.project,
      status: 'active',
      _id: { $ne: sprintId },
    });
    if (activeSprint) {
      throw new AppError('An active sprint already exists. Complete it first.', 400);
    }

    sprint.status = 'active';
    await sprint.save();
    return sprint;
  }

  async complete(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);
    if (sprint.status !== 'active') {
      throw new AppError('Only active sprints can be completed', 400);
    }

    sprint.status = 'completed';
    sprint.completedAt = new Date();

    const completedBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: { $in: ['resolved', 'closed'] },
    });
    const totalBugs = await Bug.countDocuments({ sprint: sprintId });

    if (totalBugs > 0) {
      sprint.velocity = Math.round((completedBugs / totalBugs) * 100);
    }

    const previousSprints = await Sprint.find({
      project: sprint.project,
      status: 'completed',
      _id: { $ne: sprintId },
    }).sort({ completedAt: -1 }).limit(5);

    if (previousSprints.length > 0) {
      const avgVelocity = previousSprints.reduce((sum, s) => sum + (s.velocity || 0), 0) / previousSprints.length;
      sprint.averageVelocity = Math.round((avgVelocity + (sprint.velocity || 0)) / 2);
    } else {
      sprint.averageVelocity = sprint.velocity || 0;
    }

    await sprint.save();
    return sprint;
  }

  async cancel(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    sprint.status = 'cancelled';
    await sprint.save();

    await Bug.updateMany(
      { sprint: sprintId },
      { sprint: null }
    );
    await Task.updateMany(
      { sprint: sprintId },
      { sprint: null }
    );
    await Story.updateMany(
      { sprint: sprintId },
      { sprint: null }
    );
    return sprint;
  }

  async getSprintStats(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    const totalBugs = await Bug.countDocuments({ sprint: sprintId });
    const completedBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: { $in: ['resolved', 'closed'] },
    });
    const inProgressBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: 'in_progress',
    });
    const todoBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: { $in: ['backlog', 'todo'] },
    });
    const inReviewBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: 'in_review',
    });

    const totalTasks = await Task.countDocuments({ sprint: sprintId });
    const completedTasks = await Task.countDocuments({
      sprint: sprintId,
      status: 'done',
    });

    const totalStories = await Story.countDocuments({ sprint: sprintId });
    const completedStories = await Story.countDocuments({
      sprint: sprintId,
      status: 'done',
    });

    const totalItems = totalBugs + totalTasks + totalStories;
    const completedItems = completedBugs + completedTasks + completedStories;

    const totalDays = Math.ceil((sprint.endDate - sprint.startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((new Date() - sprint.startDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

    const burnupData = this.generateBurnupData(sprint, totalItems);

    return {
      totalBugs,
      completedBugs,
      inProgressBugs,
      inReviewBugs,
      todoBugs,
      totalTasks,
      completedTasks,
      totalStories,
      completedStories,
      totalItems,
      completedItems,
      completionPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      progress,
      totalDays,
      elapsedDays,
      remainingDays,
      velocity: sprint.velocity || 0,
      averageVelocity: sprint.averageVelocity || 0,
      capacity: sprint.capacity || 0,
      burnup: burnupData,
    };
  }

  async getBurnupData(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    const totalItems = await this.getTotalItemsForSprint(sprintId);
    return this.generateBurnupData(sprint, totalItems);
  }

  async getBurndownData(sprintId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    const totalDays = Math.ceil((sprint.endDate - sprint.startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((new Date() - sprint.startDate) / (1000 * 60 * 60 * 24));
    const totalItems = await this.getTotalItemsForSprint(sprintId);

    const burndown = [];
    const completedItems = await this.getCompletedItemsForSprint(sprintId);

    for (let i = 0; i <= Math.min(elapsedDays, totalDays); i++) {
      const date = new Date(sprint.startDate);
      date.setDate(date.getDate() + i);

      const completedByDay = await this.getCompletedItemsByDate(sprintId, date);

      burndown.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        ideal: totalItems - (totalItems / totalDays) * (i + 1),
        actual: totalItems - completedByDay,
      });
    }

    return burndown;
  }

  async getTotalItemsForSprint(sprintId) {
    const totalBugs = await Bug.countDocuments({ sprint: sprintId });
    const totalTasks = await Task.countDocuments({ sprint: sprintId });
    const totalStories = await Story.countDocuments({ sprint: sprintId });
    return totalBugs + totalTasks + totalStories;
  }

  async getCompletedItemsForSprint(sprintId) {
    const completedBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: { $in: ['resolved', 'closed'] },
    });
    const completedTasks = await Task.countDocuments({
      sprint: sprintId,
      status: 'done',
    });
    const completedStories = await Story.countDocuments({
      sprint: sprintId,
      status: 'done',
    });
    return completedBugs + completedTasks + completedStories;
  }

  async getCompletedItemsByDate(sprintId, date) {
    const completedBugs = await Bug.countDocuments({
      sprint: sprintId,
      status: { $in: ['resolved', 'closed'] },
      updatedAt: { $lte: date },
    });
    const completedTasks = await Task.countDocuments({
      sprint: sprintId,
      status: 'done',
      updatedAt: { $lte: date },
    });
    const completedStories = await Story.countDocuments({
      sprint: sprintId,
      status: 'done',
      updatedAt: { $lte: date },
    });
    return completedBugs + completedTasks + completedStories;
  }

  generateBurnupData(sprint, totalItems) {
    return {
      total: totalItems,
      completed: 0,
      remaining: totalItems,
    };
  }

  async addGoal(sprintId, description) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    sprint.goals.push({ description });
    await sprint.save();
    return sprint;
  }

  async completeGoal(sprintId, goalId) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    const goal = sprint.goals.id(goalId);
    if (!goal) throw new AppError('Goal not found', 404);

    goal.completed = true;
    goal.completedAt = new Date();
    await sprint.save();
    return sprint;
  }

  async setRetrospective(sprintId, data) {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found', 404);

    sprint.retrospective = {
      whatWentWell: data.whatWentWell || [],
      whatCanImprove: data.whatCanImprove || [],
      actionItems: data.actionItems || [],
    };
    await sprint.save();
    return sprint;
  }
}

module.exports = new SprintService();