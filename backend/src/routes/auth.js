/**
 * Authentication Routes
 * Routes for user authentication and profile management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

// Import middleware
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');
const { userSchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Password change validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().messages({
    'string.min': 'New password must be at least 8 characters long',
    'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'New password is required'
  })
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validateBody(userSchemas.register),
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validateBody(userSchemas.login),
  login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authenticate,
  getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  validateBody(userSchemas.update),
  updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  authenticate,
  logout
);

module.exports = router;
