/**
 * MOCK Authentication Middleware
 * 
 * IMPORTANT: This is a DEVELOPMENT MOCK only.
 * In production, this will be replaced by the shared platform's authenticate middleware.
 * 
 * The shared middleware will:
 * - Read access_token from cookies
 * - Validate the token
 * - Attach user info to req.user
 * - Include organization_id in req.user.org_id
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Mock authenticate middleware
 * Simulates the shared platform authentication
 */
export const authenticate = (req, res, next) => {
  // In production, this would validate the JWT from cookies
  // For development, we use mock user from .env
  
  req.user = {
    id: parseInt(process.env.MOCK_USER_ID) || 1,
    org_id: parseInt(process.env.MOCK_ORG_ID) || 1,
    email: process.env.MOCK_USER_EMAIL || 'admin@company.com',
    name: 'Mock Admin',
    roles: ['admin'],
    permissions: [
      'recruitment:view',
      'recruitment:create',
      'recruitment:update',
      'recruitment:delete',
      'recruitment:approve',
      'recruitment:interview',
      'recruitment:offer',
      'recruitment:reports',
    ],
  };
  
  next();
};

/**
 * Mock permission middleware
 * Simulates the shared platform RBAC
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    // In production, this would check against the user's permissions
    // For development, we allow all permissions
    
    // Check if user has the required permission
    const hasPermission = req.user?.permissions?.includes(permission) || 
                         req.user?.permissions?.includes('*') ||
                         req.user?.roles?.includes('admin');
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: `Forbidden: Missing permission '${permission}'`,
        errors: ['Insufficient permissions'],
      });
    }
    
    next();
  };
};

/**
 * Mock audit logger
 * Simulates the shared platform audit logging
 */
export const audit = (req, action, entityType, entityId, details = {}) => {
  // In production, this would send audit data to the platform's audit service
  // For development, we just log to console
  
  const auditLog = {
    timestamp: new Date().toISOString(),
    user_id: req.user?.id || 'system',
    organization_id: req.user?.org_id || 1,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip: req.ip,
    user_agent: req.get('user-agent'),
  };
  
  console.log('[AUDIT]', JSON.stringify(auditLog, null, 2));
  
  // In production, this would be an async call to the audit service
  // For now, we return a resolved promise
  return Promise.resolve(auditLog);
};

export default {
  authenticate,
  requirePermission,
  audit,
};