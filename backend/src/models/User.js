/**
 * User Model
 * Handles all user-related database operations
 */

const db = require('../../config/database-connection');
const { hashPassword } = require('../utils/auth');
const logger = require('../utils/logger');

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'pengguna';
    this.status = data.status || 'aktif';
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new user
   * @param {object} userData - User data
   * @returns {Promise<User>} - Created user
   */
  static async create(userData) {
    try {
      const hashedPassword = await hashPassword(userData.password);
      
      const query = `
        INSERT INTO users (name, email, password, role, status, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const result = await db.query(query, [
        userData.name,
        userData.email,
        hashedPassword,
        userData.role || 'pengguna',
        userData.status || 'aktif',
        userData.isActive !== undefined ? userData.isActive : true
      ]);

      const newUser = await User.findById(result.insertId);
      logger.info(`User created: ${newUser.email}`);
      return newUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>} - User or null
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} - User or null
   */
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
      const rows = await db.query(query, [email]);
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   * @param {object} options - Query options
   * @returns {Promise<object>} - Users and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
        role = ''
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE is_active = 1';
      const queryParams = [];

      // Add search filter
      if (search) {
        whereClause += ' AND (name LIKE ? OR email LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Add role filter
      if (role) {
        whereClause += ' AND role = ?';
        queryParams.push(role);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get users
      const query = `
        SELECT id, name, email, role, status, is_active, created_at, updated_at
        FROM users ${whereClause}
        ORDER BY ${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const users = rows.map(row => new User(row));

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {object} updateData - Data to update
   * @returns {Promise<User|null>} - Updated user
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          // Handle special field mappings
          if (key === 'isActive') {
            fields.push('is_active = ?');
            values.push(updateData[key]);
          } else {
            fields.push(`${key} = ?`);
            values.push(updateData[key]);
          }
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedUser = await User.findById(id);
      logger.info(`User updated: ${updatedUser?.email}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Soft delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?';
      const result = await db.query(query, [id]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`User deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {number} excludeId - ID to exclude from check
   * @returns {Promise<boolean>} - Email exists status
   */
  static async emailExists(email, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM users WHERE email = ? AND is_active = 1';
      const params = [email];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await db.query(query, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }

  /**
   * Convert user to JSON (excluding password)
   * @returns {object} - User object without password
   */
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
