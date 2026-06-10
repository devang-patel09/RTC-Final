const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { hasPermission, ROLES } = require('../config/permissions');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const decoded = jwt.verify(token, config.jwtPublicKey, { algorithms: ['RS256'] });
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401));
    }
    return next(new AppError('Invalid token.', 401));
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError(`Missing required permission: ${permission}`, 403));
    }
    next();
  };
};

const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    const hasAny = permissions.some(p => hasPermission(req.user.role, p));
    if (!hasAny) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    const hasAll = permissions.every(p => hasPermission(req.user.role, p));
    if (!hasAll) {
      return next(new AppError('Missing required permissions.', 403));
    }
    next();
  };
};

const projectAccess = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.params.id || req.body.project;
    
    if (!projectId) return next(new AppError('Project ID required.', 400));
    
    const project = await Project.findById(projectId);
    if (!project) return next(new AppError('Project not found.', 404));
    
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      const userOrgId = req.user.organizationId?.toString();
      if (project.organizationId && userOrgId && project.organizationId.toString() !== userOrgId) {
        return next(new AppError('Access denied. Cross-organization access is not allowed.', 403));
      }
    }
    
    const isOwner = project.owner.toString() === req.userId.toString();
    const isMember = project.members.some(m => m.user.toString() === req.userId.toString());
    
    if (!isOwner && !isMember && req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ORG_ADMIN) {
      if (!hasPermission(req.user.role, 'project:view')) {
        return next(new AppError('Access denied. Not a project member.', 403));
      }
    }
    
    req.project = project;
    const memberEntry = project.members.find(m => m.user.toString() === req.userId.toString());
    req.projectRole = isOwner ? 'admin' : memberEntry?.role || req.user.role;
    next();
  } catch (error) {
    next(error);
  }
};

const projectAdmin = (req, res, next) => {
  if (req.projectRole !== 'admin' && !hasPermission(req.user.role, 'project:manage_members')) {
    return next(new AppError('Only project admins can perform this action.', 403));
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

const organizationAccess = async (req, res, next) => {
  try {
    const Organization = require('../models/Organization');
    const orgId = req.params.organizationId || req.user.organizationId;
    
    if (!orgId) return next(new AppError('Organization ID required.', 400));
    
    if (req.user.role === ROLES.SUPER_ADMIN) {
      req.organization = await Organization.findById(orgId);
      return next();
    }
    
    if (req.user.organizationId?.toString() !== orgId.toString()) {
      return next(new AppError('Organization access denied.', 403));
    }
    
    req.organization = await Organization.findById(orgId);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  projectAccess,
  projectAdmin,
  requireRole,
  organizationAccess,
};