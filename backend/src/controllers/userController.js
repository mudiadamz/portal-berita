/**
 * User Controller
 * Handles user management operations (admin functions)
 */

const User = require('../models/User');
const { sendSuccess, sendError, sendNotFound, sendConflict } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all users
 * @route GET /api/users
 * @access Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = '',
    role = ''
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    role
  };

  const result = await User.findAll(options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Users retrieved successfully', {
    users: result.users.map(user => user.toJSON())
  }, meta);
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  sendSuccess(res, 200, 'User retrieved successfully', {
    user: user.toJSON()
  });
});

/**
 * Create new user
 * @route POST /api/users
 * @access Private (Admin only)
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return sendConflict(res, 'User with this email already exists');
  }

  // Create new user
  const userData = { name, email, password, role: role || 'pengguna' };
  const user = await User.create(userData);

  logger.info(`User created by admin: ${email}`);

  sendSuccess(res, 201, 'User created successfully', {
    user: user.toJSON()
  });
});

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, isActive } = req.body;

  // Check if user exists
  const existingUser = await User.findById(id);
  if (!existingUser) {
    return sendNotFound(res, 'User not found');
  }

  // Check if email is being changed and if it already exists
  if (email && email !== existingUser.email) {
    const emailExists = await User.emailExists(email, id);
    if (emailExists) {
      return sendConflict(res, 'Email already in use');
    }
  }

  // Prepare update data
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (status !== undefined) updateData.status = status;
  if (isActive !== undefined) updateData.is_active = isActive;

  // Update user
  const updatedUser = await User.update(id, updateData);

  logger.info(`User updated by admin: ${updatedUser.email}`);

  sendSuccess(res, 200, 'User updated successfully', {
    user: updatedUser.toJSON()
  });
});

/**
 * Delete user (soft delete)
 * @route DELETE /api/users/:id
 * @access Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await User.findById(id);
  if (!existingUser) {
    return sendNotFound(res, 'User not found');
  }

  // Prevent admin from deleting themselves
  if (id == req.user.id) {
    return sendError(res, 400, 'You cannot delete your own account');
  }

  // Soft delete user
  const success = await User.delete(id);
  
  if (!success) {
    return sendError(res, 500, 'Failed to delete user');
  }

  logger.info(`User deleted by admin: ${existingUser.email}`);

  sendSuccess(res, 200, 'User deleted successfully');
});

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @access Private (Admin only)
 */
const getUserStats = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');
  
  // Get user statistics
  const statsQuery = `
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
      COUNT(CASE WHEN role = 'jurnalis' THEN 1 END) as jurnalis_count,
      COUNT(CASE WHEN role = 'instansi' THEN 1 END) as instansi_count,
      COUNT(CASE WHEN role = 'pengguna' THEN 1 END) as pengguna_count,
      COUNT(CASE WHEN status = 'aktif' THEN 1 END) as active_users,
      COUNT(CASE WHEN status = 'nonaktif' THEN 1 END) as inactive_users,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as enabled_users,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as disabled_users,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as users_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as users_this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as users_this_month
    FROM users
  `;
  
  const stats = await db.query(statsQuery);

  sendSuccess(res, 200, 'User statistics retrieved successfully', {
    stats: stats[0]
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
