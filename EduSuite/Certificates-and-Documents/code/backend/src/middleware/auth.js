const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const UserModel = require('../models/User.model');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await UserModel.findById(decoded.userId, decoded.orgId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = {
      userId: decoded.userId,
      orgId: decoded.orgId,
      email: decoded.email,
      role: decoded.role
    };
    req.userData = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.userData;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Super admin has all permissions
      if (user.role === 'super_admin') {
        return next();
      }

      const permissions = user.permissions || {};
      if (!permissions[permission]) {
        return res.status(403).json({
          success: false,
          error: `Missing permission: ${permission}`
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

const verifyOrganization = (req, res, next) => {
  const orgId = req.params.orgId || req.body.orgId || req.query.orgId;
  
  if (orgId && req.user.orgId !== parseInt(orgId)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied to this organization'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  verifyOrganization
};