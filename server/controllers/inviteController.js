const OrganizationService = require('../services/OrganizationService');
const Invite = require('../models/Invite');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

exports.accept = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return next(new AppError('Invite token is required', 400));

    const invite = await Invite.findOne({ token });
    if (!invite) return next(new AppError('Invalid invite token', 400));
    if (invite.status !== 'pending') return next(new AppError('Invite has already been used', 400));
    if (invite.expiresAt < new Date()) return next(new AppError('Invite has expired', 400));

    const existing = await User.findOne({ email: invite.email });
    if (!existing) return next(new AppError('Please create an account first before accepting the invite', 400));

    const result = await OrganizationService.acceptInvite(token, existing._id);
    res.json({ success: true, data: result, message: 'Invite accepted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getByToken = async (req, res, next) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token })
      .populate('organization', 'name logo')
      .populate('invitedBy', 'fullName');
    if (!invite) return next(new AppError('Invalid invite token', 404));
    res.json({ success: true, data: { email: invite.email, role: invite.role, organization: invite.organization, invitedBy: invite.invitedBy, status: invite.status, expiresAt: invite.expiresAt } });
  } catch (error) {
    next(error);
  }
};