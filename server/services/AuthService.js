const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Workspace = require('../models/Workspace');
const RefreshToken = require('../models/RefreshToken');
const config = require('../config');
const { AppError } = require('../utils/errors');
const { generateToken } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const { welcomeEmail } = require('../templates/emailTemplates');
const { ROLES } = require('../config/permissions');

class AuthService {
  generateAccessToken(userId, role) {
    return jwt.sign({ id: userId, role }, config.jwtPrivateKey, {
      algorithm: 'RS256',
      expiresIn: config.jwtAccessExpiry,
    });
  }

  generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  async register(data) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    const verificationToken = generateToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const accountType = data.accountType || (data.organizationName ? 'organization' : 'individual');
    let organizationId = null;
    let workspaceId = null;
    let userRole = ROLES.DEVELOPER;

    if (accountType === 'organization') {
      if (!data.organizationName) {
        throw new AppError('Organization name is required for organization accounts', 400);
      }
      const slug = data.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const org = await Organization.create({
        name: data.organizationName,
        slug,
        owner: null,
        plan: 'free',
        subscriptionPlan: 'free',
        status: 'active',
        maxProjects: 5,
        maxMembers: 10,
      });
      organizationId = org._id;
      userRole = ROLES.ORG_ADMIN;
    }

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      accountType,
      role: userRole,
      organizationId,
      workspaceId,
      verificationToken,
      verificationTokenExpires,
    });

    if (accountType === 'organization') {
      await Organization.findByIdAndUpdate(organizationId, { owner: user._id });
      const workspace = await Workspace.create({
        name: data.organizationName,
        owner: user._id,
        type: 'organization',
        organizationId,
      });
      workspaceId = workspace._id;
      user.workspaceId = workspaceId;
      await user.save();
    } else {
      const workspace = await Workspace.create({
        name: `${data.fullName}'s Workspace`,
        owner: user._id,
        type: 'personal',
      });
      workspaceId = workspace._id;
      user.workspaceId = workspaceId;
      await user.save();
    }

    const verifyUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address',
      html: welcomeEmail(user.fullName.split(' ')[0], verifyUrl),
    });

    const accessToken = this.generateAccessToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken();

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken };
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = this.generateAccessToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken();

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    user.lastActive = new Date();
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async refresh(oldToken) {
    const stored = await RefreshToken.findOne({ token: oldToken, isRevoked: false });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    stored.isRevoked = true;
    stored.revokedAt = new Date();
    await stored.save();

    const user = await User.findById(stored.user);
    if (!user) throw new AppError('User not found', 404);

    const accessToken = this.generateAccessToken(user._id, user.role);
    const newRefreshToken = this.generateRefreshToken();

    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  async verifyEmail(token) {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) throw new AppError('Invalid or expired verification token', 400);

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    return user;
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) return { message: 'If the email exists, a reset link has been sent.' };

    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password reset request',
      html: `<h1>Reset your password</h1><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
    });

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token, password) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await RefreshToken.deleteMany({ user: user._id });
    return user;
  }

  async updateProfile(userId, data) {
    const allowedFields = ['fullName', 'avatar', 'bio', 'notificationPreferences'];
    const updates = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async createOrganization(userId, organizationName) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.accountType === 'organization') {
      throw new AppError('You already belong to an organization', 400);
    }

    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const org = await Organization.create({
      name: organizationName,
      slug,
      owner: user._id,
      plan: 'free',
      subscriptionPlan: 'free',
      status: 'active',
      maxProjects: 5,
      maxMembers: 10,
    });

    const workspace = await Workspace.create({
      name: organizationName,
      owner: user._id,
      type: 'organization',
      organizationId: org._id,
    });

    user.accountType = 'organization';
    user.organizationId = org._id;
    user.workspaceId = workspace._id;
    user.role = ROLES.ORG_ADMIN;
    await user.save();

    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect', 401);

    user.password = newPassword;
    await user.save();

    await RefreshToken.deleteMany({ user: userId });
    return user;
  }

  async deleteAccount(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    await RefreshToken.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);
    return { deleted: true };
  }
}

module.exports = new AuthService();