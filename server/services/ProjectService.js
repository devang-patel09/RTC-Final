const Project = require('../models/Project');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { generateProjectKey } = require('../utils/helpers');

class ProjectService {
  async create(data, userId, organizationId) {
    let key = data.key || generateProjectKey(data.title);
    const existing = await Project.findOne({ key });
    if (existing) {
      key = key + Math.random().toString(36).substring(2, 4).toUpperCase();
    }

    const project = await Project.create({
      title: data.title,
      description: data.description,
      key,
      owner: userId,
      organizationId,
      startDate: data.startDate,
      endDate: data.endDate,
      members: [{ user: userId, role: 'admin' }],
    });

    return project.populate('owner members.user', 'fullName email avatar');
  }

  async getAll(userId, query = {}) {
    const filter = {
      $or: [
        { owner: userId },
        { 'members.user': userId },
      ],
      status: query.status || { $ne: 'deleted' },
    };

    const projects = await Project.find(filter)
      .populate('owner members.user', 'fullName email avatar')
      .sort({ updatedAt: -1 });

    return projects;
  }

  async getById(projectId, userId) {
    const project = await Project.findById(projectId)
      .populate('owner members.user', 'fullName email avatar');
    if (!project) throw new AppError('Project not found', 404);
    return project;
  }

  async update(projectId, data, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);
    if (project.owner.toString() !== userId.toString()) {
      throw new AppError('Only project owner can update', 403);
    }

    Object.assign(project, data);
    await project.save();
    return project.populate('owner members.user', 'fullName email avatar');
  }

  async delete(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);
    if (project.owner.toString() !== userId.toString()) {
      throw new AppError('Only project owner can delete', 403);
    }
    project.status = 'deleted';
    await project.save();
  }

  async inviteMember(projectId, email, role, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);
    if (project.owner.toString() !== userId.toString()) {
      throw new AppError('Only project owner can invite members', 403);
    }

    const user = await User.findOne({ email });
    if (!user) throw new AppError('User not found with this email', 404);

    const isMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (isMember) throw new AppError('User is already a member', 400);

    project.members.push({ user: user._id, role });
    await project.save();
    return project.populate('members.user', 'fullName email avatar');
  }

  async removeMember(projectId, memberId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);
    if (project.owner.toString() !== userId.toString()) {
      throw new AppError('Only project owner can remove members', 403);
    }

    project.members = project.members.filter(m => m.user.toString() !== memberId);
    await project.save();
    return project.populate('members.user', 'fullName email avatar');
  }

  async updateMemberRole(projectId, memberId, role, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);
    if (project.owner.toString() !== userId.toString()) {
      throw new AppError('Only project owner can change roles', 403);
    }

    const member = project.members.find(m => m.user.toString() === memberId);
    if (!member) throw new AppError('Member not found', 404);
    member.role = role;
    await project.save();
    return project.populate('members.user', 'fullName email avatar');
  }

  async getMembers(projectId) {
    const project = await Project.findById(projectId)
      .populate('members.user', 'fullName email avatar role');
    if (!project) throw new AppError('Project not found', 404);
    return project.members;
  }
}

module.exports = new ProjectService();
