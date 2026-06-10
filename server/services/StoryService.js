const Story = require('../models/Story');
const ActivityService = require('./ActivityService');
const { AppError } = require('../utils/errors');

class StoryService {
  async create(data, userId) {
    const story = await Story.create({ ...data, reporter: userId });
    await story.populate(['reporter', 'assignee', 'sprint'], 'fullName email avatar');
    await ActivityService.log({
      user: userId,
      project: data.project,
      action: 'story_created',
      entityType: 'story',
      entityId: story._id,
      details: { title: story.title },
    });
    return story;
  }

  async getAll(projectId, query = {}) {
    const filter = { project: projectId };
    if (query.status) filter.status = query.status;
    if (query.sprint) filter.sprint = query.sprint;
    if (query.assignee) filter.assignee = query.assignee;
    if (query.priority) filter.priority = query.priority;

    const stories = await Story.find(filter)
      .populate('reporter assignee sprint', 'fullName email avatar')
      .populate('dependencies.dependsOn', 'title')
      .sort({ order: 1, createdAt: -1 });
    return stories;
  }

  async getById(storyId) {
    const story = await Story.findById(storyId)
      .populate('reporter assignee sprint', 'fullName email avatar')
      .populate('dependencies.dependsOn', 'title status');
    if (!story) throw new AppError('Story not found', 404);
    return story;
  }

  async update(storyId, data, userId) {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', 404);

    const updatable = ['title', 'description', 'status', 'priority', 'assignee', 'sprint', 'storyPoints', 'labels', 'order'];
    for (const field of updatable) {
      if (data[field] !== undefined) {
        if (data[field] === null) {
          story[field] = null;
        } else {
          story[field] = data[field];
        }
      }
    }

    if (data.acceptanceCriteria) {
      story.acceptanceCriteria = data.acceptanceCriteria;
    }

    if (data.dependencies) {
      story.dependencies = data.dependencies;
    }

    await story.save();
    await story.populate(['reporter', 'assignee', 'sprint'], 'fullName email avatar');

    if (data.status) {
      await ActivityService.log({
        user: userId,
        project: story.project,
        action: 'story_status_changed',
        entityType: 'story',
        entityId: story._id,
        details: { status: data.status },
      });
    }

    return story;
  }

  async delete(storyId, userId) {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', 404);

    await Story.findByIdAndDelete(storyId);

    await ActivityService.log({
      user: userId,
      project: story.project,
      action: 'story_deleted',
      entityType: 'story',
      entityId: storyId,
      details: { title: story.title },
    });
  }

  async reorder(projectId, orderedIds) {
    for (let i = 0; i < orderedIds.length; i++) {
      await Story.findByIdAndUpdate(orderedIds[i], { order: i });
    }
  }

  async getBySprint(sprintId) {
    return Story.find({ sprint: sprintId })
      .populate('reporter assignee', 'fullName email avatar')
      .sort({ order: 1 });
  }

  async updateAcceptanceCriteria(storyId, criteriaId, data, userId) {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', 404);

    const criteria = story.acceptanceCriteria.id(criteriaId);
    if (!criteria) throw new AppError('Acceptance criteria not found', 404);

    if (data.description) criteria.description = data.description;
    if (data.satisfied !== undefined) criteria.satisfied = data.satisfied;

    await story.save();
    return story.populate(['reporter', 'assignee'], 'fullName email avatar');
  }

  async addWatcher(storyId, userId) {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', 404);
    if (!story.watchers.includes(userId)) {
      story.watchers.push(userId);
      await story.save();
    }
    return story.populate('watchers', 'fullName email avatar');
  }

  async removeWatcher(storyId, userId) {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', 404);
    story.watchers = story.watchers.filter(w => w.toString() !== userId.toString());
    await story.save();
    return story.populate('watchers', 'fullName email avatar');
  }
}

module.exports = new StoryService();