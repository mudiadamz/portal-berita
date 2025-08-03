/**
 * Authentication and Authorization Middleware
 * JWT-based authentication with role-based access control
 */

const { verifyAccessToken } = require('../utils/auth');
const { sendUnauthorized, sendForbidden } = require('../utils/response');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Access token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return sendUnauthorized(res, 'User not found');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return sendUnauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't require it
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Authorization middleware factory
 * Creates middleware to check user roles
 * @param {string|Array} roles - Required role(s)
 * @returns {function} - Express middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${userRole}. Required roles: ${allowedRoles.join(', ')}`);
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin privileges
 * @param {string} resourceIdParam - Parameter name containing resource ID
 * @param {string} ownerField - Field name in user object that contains owner ID
 * @returns {function} - Express middleware function
 */
const checkOwnership = (resourceIdParam = 'id', ownerField = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user[ownerField];

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (resourceId && resourceId.toString() !== userId.toString()) {
      logger.warn(`Access denied: User ${userId} attempted to access resource ${resourceId}`);
      return sendForbidden(res, 'Access denied: You can only access your own resources');
    }

    next();
  };
};

/**
 * Admin only middleware
 * Shorthand for authorize(['admin'])
 */
const adminOnly = authorize(['admin']);

/**
 * Admin or Jurnalis middleware
 * Shorthand for authorize(['admin', 'jurnalis'])
 */
const adminOrJurnalis = authorize(['admin', 'jurnalis']);

/**
 * Admin, Jurnalis, or Instansi middleware
 * Shorthand for authorize(['admin', 'jurnalis', 'instansi'])
 */
const contentCreators = authorize(['admin', 'jurnalis', 'instansi']);

/**
 * Instansi only middleware
 * Shorthand for authorize(['instansi'])
 */
const instansiOnly = authorize(['instansi']);

/**
 * Jurnalis only middleware
 * Shorthand for authorize(['jurnalis'])
 */
const jurnalisOnly = authorize(['jurnalis']);

/**
 * Check if user can manage institution channel
 * Admin can manage any channel, instansi can only manage their own
 */
const canManageChannel = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  // Admin can manage any channel
  if (req.user.role === 'admin') {
    return next();
  }

  // Instansi can only manage their own channels
  if (req.user.role === 'instansi') {
    // This will be checked in the controller with the actual channel data
    return next();
  }

  return sendForbidden(res, 'Insufficient permissions to manage channels');
};

/**
 * Check if user can create/edit news
 * Admin, jurnalis, and instansi can create news
 */
const canManageNews = authorize(['admin', 'jurnalis', 'instansi']);

/**
 * Check if user can publish news
 * Only admin and jurnalis can publish news directly
 */
const canPublishNews = authorize(['admin', 'jurnalis']);

/**
 * Authenticated users only middleware
 * Shorthand for authenticate
 */
const authRequired = authenticate;

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  checkOwnership,
  adminOnly,
  adminOrJurnalis,
  contentCreators,
  instansiOnly,
  jurnalisOnly,
  canManageChannel,
  canManageNews,
  canPublishNews,
  authRequired
};
