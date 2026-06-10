const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../middleware/auth');
const User = require('../models/User');
const { PERMISSIONS, ROLES } = require('../config/permissions');

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.USER_VIEW), async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    const users = await User.find(filter).select('fullName email avatar role isOnline lastActive');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = {
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    };
    if (req.user.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    const users = await User.find(filter).select('fullName email avatar').limit(10);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/role', requirePermission(PERMISSIONS.USER_ROLE_CHANGE), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id).select('organizationId role');
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user.organizationId?.toString() !== target.organizationId?.toString() && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Cross-organization role changes not allowed' });
    }

    const { canManageRole } = require('../config/permissions');
    if (!canManageRole(req.user.role, target.role)) {
      return res.status(403).json({ success: false, message: 'Cannot change role of a user with equal or higher rank' });
    }
    if (!canManageRole(req.user.role, req.body.role)) {
      return res.status(403).json({ success: false, message: 'Cannot assign a role equal to or higher than your own' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('fullName email avatar role');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.get('/me/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password -refreshTokens');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;