/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return sendError(res, 400, 'Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired');
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 409, 'Resource already exists');
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 400, 'Referenced resource does not exist');
  }

  // Custom application errors
  if (err.statusCode) {
    return sendError(res, err.statusCode, err.message);
  }

  // Default server error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  return sendError(res, 500, message);
};

/**
 * 404 Not Found handler
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  return sendError(res, 404, `Route ${req.method} ${req.url} not found`);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {function} fn - Async function to wrap
 * @returns {function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};
