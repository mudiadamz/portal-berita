/**
 * User Management Routes
 * Routes for user administration (admin only)
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// Import middleware
const { authenticate, adminOnly } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { userSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be positive',
    'any.required': 'User ID is required'
  })
});

// User creation schema (admin can set any role)
const adminCreateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('pengguna', 'jurnalis', 'admin', 'instansi').default('pengguna'),
  status: Joi.string().valid('aktif', 'nonaktif').default('aktif')
});

// User update schema (admin can update any field including role and status)
const adminUpdateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address'
  }),
  role: Joi.string().valid('pengguna', 'jurnalis', 'admin', 'instansi'),
  status: Joi.string().valid('aktif', 'nonaktif'),
  isActive: Joi.boolean()
}).min(1);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  authenticate,
  adminOnly,
  readLimiter,
  getUserStats
);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/',
  authenticate,
  adminOnly,
  readLimiter,
  validateQuery(querySchemas.pagination),
  getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id',
  authenticate,
  adminOnly,
  readLimiter,
  validateParams(idParamSchema),
  getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/',
  authenticate,
  adminOnly,
  writeLimiter,
  validateBody(adminCreateUserSchema),
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticate,
  adminOnly,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(adminUpdateUserSchema),
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  adminOnly,
  writeLimiter,
  validateParams(idParamSchema),
  deleteUser
);

module.exports = router;
