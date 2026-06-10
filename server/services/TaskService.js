const Task = require('../models/Task');
const ActivityService = require('./ActivityService');
const { AppError } = require('../utils/errors');

class TaskService {
  async create(data, userId) {
    const task = await Task.create({ ...data, reporter: userId });
    await task.populate(['reporter', 'assignee', 'assignees', 'sprint'], 'fullName email avatar');
    await ActivityService.log({
      user: userId,
      project: data.project,
      action: 'task_created',
      entityType: 'task',
      entityId: task._id,
      details: { title: task.title },
    });
    return task;
  }

  async getAll(projectId, query = {}) {
    const filter = { project: projectId };
    if (query.status) filter.status = query.status;
    if (query.sprint) filter.sprint = query.sprint;
    if (query.assignee) filter.assignee = query.assignee;
    if (query.type) filter.type = query.type;
    if (query.priority) filter.priority = query.priority;

    const tasks = await Task.find(filter)
      .populate('reporter assignee assignees sprint', 'fullName email avatar')
      .sort({ order: 1, createdAt: -1 });
    return tasks;
  }

  async getById(taskId) {
    const task = await Task.findById(taskId)
      .populate('reporter assignee assignees sprint parentTask', 'fullName email avatar');
    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  async update(taskId, data, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);

    const updatable = ['title', 'description', 'status', 'priority', 'assignee', 'assignees', 'sprint', 'storyPoints', 'estimatedHours', 'actualHours', 'dueDate', 'order', 'labels', 'parentTask'];
    for (const field of updatable) {
      if (data[field] !== undefined) {
        if (field === 'assignee' && data[field] === null) {
          task.assignee = null;
        } else if (field === 'assignees' && data[field] === null) {
          task.assignees = [];
        } else if (field === 'sprint' && data[field] === null) {
          task.sprint = null;
        } else {
          task[field] = data[field];
        }
      }
    }

    if (data.status === 'done' && !task.completedAt) task.completedAt = new Date();

    await task.save();
    await task.populate(['reporter', 'assignee', 'assignees', 'sprint'], 'fullName email avatar');

    if (data.status) {
      await ActivityService.log({
        user: userId,
        project: task.project,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: task._id,
        details: { status: data.status },
      });
    }

    return task;
  }

  async delete(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);

    await Task.deleteMany({ parentTask: taskId });
    await Task.findByIdAndDelete(taskId);

    await ActivityService.log({
      user: userId,
      project: task.project,
      action: 'task_deleted',
      entityType: 'task',
      entityId: taskId,
      details: { title: task.title },
    });
  }

  async reorder(projectId, orderedIds) {
    for (let i = 0; i < orderedIds.length; i++) {
      await Task.findByIdAndUpdate(orderedIds[i], { order: i });
    }
  }

  async bulkUpdate(projectId, taskIds, data, userId) {
    const results = [];
    for (const taskId of taskIds) {
      try {
        const task = await this.update(taskId, data, userId);
        results.push(task);
      } catch (err) {
        results.push({ _id: taskId, error: err.message });
      }
    }
    return results;
  }

  async getBySprint(sprintId) {
    return Task.find({ sprint: sprintId })
      .populate('reporter assignee assignees', 'fullName email avatar')
      .sort({ order: 1 });
  }

  async addWatcher(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    if (!task.watchers.includes(userId)) {
      task.watchers.push(userId);
      await task.save();
    }
    return task.populate('watchers', 'fullName email avatar');
  }

  async removeWatcher(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    task.watchers = task.watchers.filter(w => w.toString() !== userId.toString());
    await task.save();
    return task.populate('watchers', 'fullName email avatar');
  }
}

module.exports = new TaskService();