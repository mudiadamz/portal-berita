/**
 * Authentication Controller
 * Handles user authentication operations
 */

const User = require('../models/User');
const { comparePassword, generateAccessToken, generateRefreshToken, hashPassword } = require('../utils/auth');
const { sendSuccess, sendError, sendUnauthorized, sendConflict } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const db = require('../../config/database-connection');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return sendConflict(res, 'User with this email already exists');
  }

  // Create new user
  const userData = { name, email, password };
  if (role && ['pengguna', 'jurnalis', 'admin', 'instansi'].includes(role)) {
    userData.role = role;
  }

  const user = await User.create(userData);

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  logger.info(`User registered: ${email}`);

  sendSuccess(res, 201, 'User registered successfully', {
    user: user.toJSON(),
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Find user by email (including password for comparison)
  const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
  const rows = await db.query(query, [email]);
  console.log(`length`, rows.length);
  
  if (rows.length === 0) {
    return sendUnauthorized(res, 'Invalid email or password');
  }

  const userData = rows[0];
  const user = new User(userData);
  console.log(`user`, userData.password);
  console.log('password', password);
  // Compare password
  const isPasswordValid = await comparePassword(password, userData.password);
  if (!isPasswordValid) {
    return sendUnauthorized(res, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  logger.info(`User logged in: ${email}`);

  sendSuccess(res, 200, 'Login successful', {
    user: user.toJSON(),
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile retrieved successfully', {
    user: req.user.toJSON()
  });
});

/**
 * Update current user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  // Check if email is being changed and if it already exists
  if (email && email !== req.user.email) {
    const emailExists = await User.emailExists(email, userId);
    if (emailExists) {
      return sendConflict(res, 'Email already in use');
    }
  }

  // Update user
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;

  const updatedUser = await User.update(userId, updateData);
  
  if (!updatedUser) {
    return sendError(res, 404, 'User not found');
  }

  logger.info(`User profile updated: ${updatedUser.email}`);

  sendSuccess(res, 200, 'Profile updated successfully', {
    user: updatedUser.toJSON()
  });
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Get user with password
  const query = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
  const rows = await db.query(query, [userId]);
  
  if (rows.length === 0) {
    return sendError(res, 404, 'User not found');
  }

  const userData = rows[0];

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, userData.password);
  if (!isCurrentPasswordValid) {
    return sendUnauthorized(res, 'Current password is incorrect');
  }

  // Hash and update new password
  const hashedNewPassword = await hashPassword(newPassword);
  
  await User.update(userId, { password: hashedNewPassword });

  logger.info(`Password changed for user: ${req.user.email}`);

  sendSuccess(res, 200, 'Password changed successfully');
});

/**
 * Logout user (client-side token removal)
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a JWT implementation, logout is typically handled client-side
  // by removing the token from storage. Server-side logout would require
  // token blacklisting which is not implemented in this basic version.
  
  logger.info(`User logged out: ${req.user.email}`);
  
  sendSuccess(res, 200, 'Logout successful');
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
