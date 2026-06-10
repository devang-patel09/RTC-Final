const Organization = require('../models/Organization');
const User = require('../models/User');
const Invite = require('../models/Invite');
const Project = require('../models/Project');
const { AppError } = require('../utils/errors');
const { generateToken } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const { ROLES } = require('../config/permissions');
const config = require('../config');

class OrganizationService {
  async create(data, userId) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await Organization.findOne({ slug });
    if (existing) {
      throw new AppError('An organization with this name already exists', 400);
    }

    const org = await Organization.create({
      name: data.name,
      slug,
      owner: userId,
      logo: data.logo || '',
      plan: data.plan || 'free',
      subscriptionPlan: data.subscriptionPlan || 'free',
      status: 'active',
      billingEmail: data.billingEmail || '',
      maxProjects: data.maxProjects || 5,
      maxMembers: data.maxMembers || 10,
    });

    await User.findByIdAndUpdate(userId, {
      organizationId: org._id,
      role: ROLES.ORG_ADMIN,
    });

    return org.populate('owner', 'fullName email');
  }

  async getById(organizationId) {
    const org = await Organization.findById(organizationId)
      .populate('owner', 'fullName email avatar');
    if (!org) throw new AppError('Organization not found', 404);
    return org;
  }

  async getByUser(userId) {
    const user = await User.findById(userId);
    if (!user || !user.organizationId) {
      throw new AppError('No organization found for this user', 404);
    }
    return this.getById(user.organizationId);
  }

  async update(organizationId, data, userId) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new AppError('Organization not found', 404);

    const fields = ['name', 'logo', 'billingEmail', 'plan', 'subscriptionPlan', 'status'];
    fields.forEach(field => {
      if (data[field] !== undefined) {
        org[field] = data[field];
      }
    });

    if (data.name && data.name !== org.name) {
      org.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    await org.save();
    return org.populate('owner', 'fullName email');
  }

  async delete(organizationId, userId) {
    const org = await Organization.findById(organizationId);
    if (!org) throw new AppError('Organization not found', 404);

    await Project.updateMany(
      { organizationId },
      { status: 'deleted', organizationId: null }
    );

    await User.updateMany(
      { organizationId },
      { organizationId: null, role: 'developer' }
    );

    await Invite.deleteMany({ organization: organizationId });
    await Organization.findByIdAndDelete(organizationId);
  }

  async getMembers(organizationId) {
    const members = await User.find({ organizationId })
      .select('fullName email role avatar isOnline lastActive')
      .sort({ createdAt: 1 });
    return members;
  }

  async updateMemberRole(organizationId, memberId, role, userId) {
    if (!Object.values(ROLES).includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const member = await User.findById(memberId);
    if (!member) throw new AppError('User not found', 404);
    if (!member.organizationId || member.organizationId.toString() !== organizationId.toString()) {
      throw new AppError('User is not a member of this organization', 404);
    }

    const org = await Organization.findById(organizationId);
    if (org.owner.toString() === memberId.toString() && role !== ROLES.ORG_ADMIN) {
      throw new AppError('Cannot change the organization owner role', 400);
    }

    member.role = role;
    await member.save();
    return member;
  }

  async removeMember(organizationId, memberId, userId) {
    const member = await User.findById(memberId);
    if (!member) throw new AppError('User not found', 404);
    if (!member.organizationId || member.organizationId.toString() !== organizationId.toString()) {
      throw new AppError('User is not a member of this organization', 404);
    }
    if (member._id.toString() === userId.toString()) {
      throw new AppError('Cannot remove yourself', 400);
    }

    const org = await Organization.findById(organizationId);
    if (org.owner.toString() === member._id.toString()) {
      throw new AppError('Cannot remove the organization owner', 400);
    }

    await Project.updateMany(
      { 'members.user': member._id },
      { $pull: { members: { user: member._id } } }
    );

    member.organizationId = null;
    member.role = 'developer';
    await member.save();
  }

  async inviteMember(organizationId, data, userId) {
    const { email, role } = data;
    if (![ROLES.DEVELOPER, ROLES.TESTER, ROLES.PROJECT_MANAGER, ROLES.VIEWER].includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${[ROLES.DEVELOPER, ROLES.TESTER, ROLES.PROJECT_MANAGER, ROLES.VIEWER].join(', ')}`, 400);
    }

    const existing = await User.findOne({ email });
    if (existing && existing.organizationId?.toString() === organizationId?.toString()) {
      throw new AppError('User is already a member of your organization', 400);
    }

    const pending = await Invite.findOne({
      organization: organizationId,
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (pending) throw new AppError('Invite already sent to this email', 400);

    const token = generateToken();
    const invite = await Invite.create({
      organization: organizationId,
      email,
      role,
      token,
      invitedBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const org = await Organization.findById(organizationId);
    const inviteUrl = `${config.clientUrl}/invite/${token}`;
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${org.name}`,
      html: `<h1>You're invited!</h1>
        <p>You have been invited to join <strong>${org.name}</strong> as a <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#285A48;color:white;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
        <p>Or copy this link: ${inviteUrl}</p>
        <p>This invitation expires in 7 days.</p>`,
    });

    return invite;
  }

  async resendInvite(organizationId, inviteId) {
    const invite = await Invite.findOne({ _id: inviteId, organization: organizationId });
    if (!invite) throw new AppError('Invite not found', 404);
    if (invite.status !== 'pending') throw new AppError('Invite is no longer pending', 400);

    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invite.save();

    const org = await Organization.findById(organizationId);
    const inviteUrl = `${config.clientUrl}/invite/${invite.token}`;
    await sendEmail({
      to: invite.email,
      subject: `Reminder: You're invited to join ${org.name}`,
      html: `<h1>Reminder!</h1>
        <p>You have been invited to join <strong>${org.name}</strong> as a <strong>${invite.role}</strong>.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#285A48;color:white;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
        <p>This invitation expires in 7 days.</p>`,
    });

    return invite;
  }

  async revokeInvite(organizationId, inviteId) {
    const invite = await Invite.findOneAndUpdate(
      { _id: inviteId, organization: organizationId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!invite) throw new AppError('Invite not found', 404);
    return invite;
  }

  async getInvites(organizationId) {
    return Invite.find({ organization: organizationId })
      .populate('invitedBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  async acceptInvite(token, userId) {
    const invite = await Invite.findOne({ token });
    if (!invite) throw new AppError('Invalid invite token', 400);
    if (invite.status !== 'pending') throw new AppError('Invite has already been used', 400);
    if (invite.expiresAt < new Date()) throw new AppError('Invite has expired', 400);

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.organizationId) {
      throw new AppError('You are already a member of an organization. Leave first.', 400);
    }

    const org = await Organization.findById(invite.organization);
    if (!org) throw new AppError('Organization no longer exists', 404);

    const memberCount = await User.countDocuments({ organizationId: invite.organization });
    if (memberCount >= org.maxMembers) {
      throw new AppError('Organization has reached maximum member capacity', 400);
    }

    user.organizationId = invite.organization;
    user.role = invite.role;
    await user.save();

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();

    return { organization: org, user };
  }

  async getStats(organizationId) {
    const totalMembers = await User.countDocuments({ organizationId });
    const totalProjects = await Project.countDocuments({ organizationId, status: { $ne: 'deleted' } });
    const totalBugs = await Project.aggregate([
      { $match: { organizationId: new (require('mongoose').Types.ObjectId)(organizationId), status: { $ne: 'deleted' } } },
      {
        $lookup: {
          from: 'bugs',
          localField: '_id',
          foreignField: 'project',
          as: 'bugs',
        },
      },
      { $unwind: { path: '$bugs', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const org = await Organization.findById(organizationId);
    return {
      totalMembers,
      totalProjects,
      totalBugs: totalBugs[0]?.count || 0,
      plan: org.plan,
      maxMembers: org.maxMembers,
      maxProjects: org.maxProjects,
    };
  }
}

module.exports = new OrganizationService();