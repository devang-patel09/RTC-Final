const Bug = require('../models/Bug');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { AppError } = require('../utils/errors');

class BugService {
  async create(data, userId) {
    const maxOrder = await Bug.findOne({ project: data.project })
      .sort({ order: -1 })
      .select('order');
    
    const bug = await Bug.create({
      ...data,
      reporter: userId,
      order: (maxOrder?.order ?? -1) + 1,
      watchers: data.watchers || [],
    });

    await ActivityLog.create({
      project: data.project,
      bug: bug._id,
      user: userId,
      action: 'created',
      entityType: 'bug',
      entityId: bug._id,
      details: { title: bug.title, severity: bug.severity, priority: bug.priority },
    });

    if (data.assignee) {
      await Notification.create({
        recipient: data.assignee,
        type: 'assignment',
        title: 'Bug Assigned',
        message: `You have been assigned to bug: ${bug.title}`,
        data: { projectId: data.project, bugId: bug._id.toString() },
      });
    }

    return bug.populate(['reporter', 'assignee'], 'fullName email avatar');
  }

  async getAll(projectId, query = {}) {
    const filter = { project: projectId };

    if (query.status) {
      if (Array.isArray(query.status)) {
        filter.status = { $in: query.status };
      } else {
        filter.status = query.status;
      }
    }
    if (query.severity) filter.severity = query.severity;
    if (query.priority) filter.priority = query.priority;
    if (query.assignee) filter.assignee = query.assignee;
    if (query.sprint) filter.sprint = query.sprint;
    if (query.labels) {
      filter.labels = { $in: Array.isArray(query.labels) ? query.labels : [query.labels] };
    }
    if (query.tags) {
      filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };
    }
    if (query.reporter) filter.reporter = query.reporter;
    if (query.watcher) filter.watchers = query.watcher;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const sortField = query.sortBy || 'order';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const bugs = await Bug.find(filter)
      .populate('reporter assignee sprint', 'fullName email avatar name')
      .sort({ [sortField]: sortOrder, createdAt: -1 });

    return bugs;
  }

  async getById(bugId) {
    const bug = await Bug.findById(bugId)
      .populate('reporter assignee sprint watchers', 'fullName email avatar');
    if (!bug) throw new AppError('Bug not found', 404);
    return bug;
  }

  async update(bugId, data, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    const changes = [];
    const oldStatus = bug.status;

    if (data.status && data.status !== bug.status) {
      if (!Bug.isValidTransition(bug.status, data.status)) {
        throw new AppError(`Cannot transition from '${bug.status}' to '${data.status}'`, 400);
      }
      changes.push(`status changed from ${bug.status} to ${data.status}`);
    }
    if (data.assignee && data.assignee !== (bug.assignee?.toString() || '')) {
      changes.push('assignee changed');
    }
    if (data.priority && data.priority !== bug.priority) {
      changes.push(`priority changed to ${data.priority}`);
    }
    if (data.severity && data.severity !== bug.severity) {
      changes.push(`severity changed to ${data.severity}`);
    }
    if (data.labels) {
      changes.push('labels updated');
    }

    if (data.version !== undefined && data.version !== bug.version) {
      throw new AppError('Conflict: this bug has been modified by another user. Please refresh and try again.', 409);
    }

    const wasUnassigned = !bug.assignee;
    const oldAssignee = bug.assignee?.toString();

    const updateData = { ...data };
    delete updateData.version;
    Object.assign(bug, updateData);
    bug.version += 1;

    if (data.watchers && Array.isArray(data.watchers)) {
      const existingWatchers = bug.watchers.map(w => w.toString());
      data.watchers.forEach(w => {
        if (!existingWatchers.includes(w)) {
          bug.watchers.push(w);
        }
      });
    }

    await bug.save();

    await ActivityLog.create({
      project: bug.project,
      bug: bug._id,
      user: userId,
      action: 'updated',
      entityType: 'bug',
      entityId: bug._id,
      details: { changes, title: bug.title },
    });

    if (data.status && data.status !== oldStatus) {
      const notifyUsers = [bug.assignee, bug.reporter, ...bug.watchers]
        .filter(Boolean)
        .map(id => id.toString())
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(id => id !== userId.toString());

      for (const recipientId of notifyUsers) {
        await Notification.create({
          recipient: recipientId,
          type: 'status_change',
          title: 'Bug Status Changed',
          message: `Bug "${bug.title}" moved to ${data.status.replace(/_/g, ' ')}`,
          data: { projectId: bug.project, bugId: bug._id.toString() },
        });
      }
    }

    if (data.assignee && data.assignee !== oldAssignee) {
      await Notification.create({
        recipient: data.assignee,
        type: 'assignment',
        title: 'Bug Assigned',
        message: `You have been assigned to bug: ${bug.title}`,
        data: { projectId: bug.project, bugId: bug._id.toString() },
      });

      if (oldAssignee && !wasUnassigned) {
        await Notification.create({
          recipient: oldAssignee,
          type: 'assignment',
          title: 'Bug Unassigned',
          message: `You have been unassigned from bug: ${bug.title}`,
          data: { projectId: bug.project, bugId: bug._id.toString() },
        });
      }
    }

    return bug.populate('reporter assignee sprint watchers', 'fullName email avatar name');
  }

  async delete(bugId, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    await ActivityLog.create({
      project: bug.project,
      bug: bug._id,
      user: userId,
      action: 'deleted',
      entityType: 'bug',
      entityId: bug._id,
      details: { title: bug.title },
    });

    await Bug.findByIdAndDelete(bugId);
  }

  async addAttachment(bugId, fileData, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    bug.attachments.push({
      url: fileData.url,
      publicId: fileData.publicId,
      originalName: fileData.originalName,
      mimeType: fileData.mimeType,
      size: fileData.size,
      uploadedBy: userId,
    });

    await bug.save();

    await ActivityLog.create({
      project: bug.project,
      bug: bug._id,
      user: userId,
      action: 'file_uploaded',
      entityType: 'bug',
      entityId: bug._id,
      details: { fileName: fileData.originalName },
    });

    return bug.populate('reporter assignee', 'fullName email avatar');
  }

  async removeAttachment(bugId, attachmentId, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    const attachment = bug.attachments.id(attachmentId);
    if (attachment && attachment.publicId) {
      try {
        const cloudinary = require('../config/cloudinary');
        await cloudinary.uploader.destroy(attachment.publicId);
      } catch (err) {
        console.error('Failed to delete file from Cloudinary:', err);
      }
    }

    bug.attachments.pull(attachmentId);
    await bug.save();
    return bug.populate('reporter assignee', 'fullName email avatar');
  }

  async reorder(projectId, orderedIds) {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, project: projectId },
        update: { order: index },
      },
    }));
    await Bug.bulkWrite(bulkOps);
  }

  async addSubtask(bugId, data, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    bug.subtasks.push({
      title: data.title,
      assignee: data.assignee,
      order: bug.subtasks.length,
    });
    await bug.save();

    await ActivityLog.create({
      project: bug.project,
      bug: bug._id,
      user: userId,
      action: 'subtask_added',
      entityType: 'bug',
      entityId: bug._id,
      details: { subtaskTitle: data.title },
    });

    return bug;
  }

  async updateSubtask(bugId, subtaskId, data, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    const subtask = bug.subtasks.id(subtaskId);
    if (!subtask) throw new AppError('Subtask not found', 404);

    if (data.title) subtask.title = data.title;
    if (data.completed !== undefined) subtask.status = data.completed ? 'done' : 'todo';
    if (data.status) subtask.status = data.status;
    if (data.assignee) subtask.assignee = data.assignee;
    if (data.order !== undefined) subtask.order = data.order;

    await bug.save();
    return bug;
  }

  async deleteSubtask(bugId, subtaskId, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    bug.subtasks.pull(subtaskId);
    await bug.save();
    return bug;
  }

  async addWatcher(bugId, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    if (!bug.watchers.includes(userId)) {
      bug.watchers.push(userId);
      await bug.save();
    }
    return bug.populate('watchers', 'fullName email avatar');
  }

  async removeWatcher(bugId, userId) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    bug.watchers = bug.watchers.filter(w => w.toString() !== userId.toString());
    await bug.save();
    return bug.populate('watchers', 'fullName email avatar');
  }

  async addLabel(bugId, label) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    const normalizedLabel = label.toLowerCase().trim();
    if (!bug.labels.includes(normalizedLabel)) {
      bug.labels.push(normalizedLabel);
      await bug.save();
    }
    return bug;
  }

  async removeLabel(bugId, label) {
    const bug = await Bug.findById(bugId);
    if (!bug) throw new AppError('Bug not found', 404);

    bug.labels = bug.labels.filter(l => l !== label.toLowerCase().trim());
    await bug.save();
    return bug;
  }

  async getProjectLabels(projectId) {
    const labels = await Bug.distinct('labels', { project: projectId });
    return labels.sort();
  }

  async getProjectTags(projectId) {
    const tags = await Bug.distinct('tags', { project: projectId });
    return tags.sort();
  }

  async bulkUpdate(projectId, bugIds, data, userId) {
    const results = [];
    for (const bugId of bugIds) {
      try {
        const bug = await this.update(bugId, data, userId);
        results.push(bug);
      } catch (err) {
        console.error(`Failed to update bug ${bugId}:`, err.message);
      }
    }
    return results;
  }
}

module.exports = new BugService();