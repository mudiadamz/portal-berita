/**
 * Post Model
 * Handles all post-related database operations
 */

const db = require('../../config/database-connection');
const logger = require('../utils/logger');

class Post {
  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.excerpt = data.excerpt;
    this.category = data.category;
    this.tags = data.tags ? (typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags) : [];
    this.status = data.status || 'draft';
    this.authorId = data.author_id;
    this.authorName = data.author_name;
    this.authorEmail = data.author_email;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new post
   * @param {object} postData - Post data
   * @returns {Promise<Post>} - Created post
   */
  static async create(postData) {
    try {
      const query = `
        INSERT INTO posts (title, content, excerpt, category, tags, status, author_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const result = await db.query(query, [
        postData.title,
        postData.content,
        postData.excerpt || null,
        postData.category,
        JSON.stringify(postData.tags || []),
        postData.status || 'draft',
        postData.authorId
      ]);

      const newPost = await Post.findById(result.insertId);
      logger.info(`Post created: ${newPost.title} by user ${postData.authorId}`);
      return newPost;
    } catch (error) {
      logger.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Find post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Post|null>} - Post or null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT p.*, u.name as author_name, u.email as author_email
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
      `;
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new Post(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding post by ID:', error);
      throw error;
    }
  }

  /**
   * Get all posts with pagination and filters
   * @param {object} options - Query options
   * @returns {Promise<object>} - Posts and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
        category = '',
        status = '',
        authorId = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      // Add search filter
      if (search) {
        whereClause += ' AND (p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Add category filter
      if (category) {
        whereClause += ' AND p.category = ?';
        queryParams.push(category);
      }

      // Add status filter
      if (status) {
        whereClause += ' AND p.status = ?';
        queryParams.push(status);
      }

      // Add author filter
      if (authorId) {
        whereClause += ' AND p.author_id = ?';
        queryParams.push(authorId);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get posts
      const query = `
        SELECT p.*, u.name as author_name, u.email as author_email
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        ${whereClause}
        ORDER BY p.${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const posts = rows.map(row => new Post(row));

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding all posts:', error);
      throw error;
    }
  }

  /**
   * Update post
   * @param {number} id - Post ID
   * @param {object} updateData - Data to update
   * @returns {Promise<Post|null>} - Updated post
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          if (key === 'tags') {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(updateData[key]));
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

      const query = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedPost = await Post.findById(id);
      logger.info(`Post updated: ${updatedPost?.title}`);
      return updatedPost;
    } catch (error) {
      logger.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * Delete post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM posts WHERE id = ?';
      const result = await db.query(query, [id]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`Post deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Get posts by author
   * @param {number} authorId - Author ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Posts and pagination info
   */
  static async findByAuthor(authorId, options = {}) {
    return Post.findAll({ ...options, authorId });
  }

  /**
   * Get posts by category
   * @param {string} category - Category name
   * @param {object} options - Query options
   * @returns {Promise<object>} - Posts and pagination info
   */
  static async findByCategory(category, options = {}) {
    return Post.findAll({ ...options, category });
  }

  /**
   * Get posts by status
   * @param {string} status - Post status
   * @param {object} options - Query options
   * @returns {Promise<object>} - Posts and pagination info
   */
  static async findByStatus(status, options = {}) {
    return Post.findAll({ ...options, status });
  }

  /**
   * Get unique categories
   * @returns {Promise<Array>} - Array of categories
   */
  static async getCategories() {
    try {
      const query = 'SELECT DISTINCT category FROM posts WHERE category IS NOT NULL ORDER BY category';
      const rows = await db.query(query);
      return rows.map(row => row.category);
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Convert post to JSON
   * @returns {object} - Post object
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      excerpt: this.excerpt,
      category: this.category,
      tags: this.tags,
      status: this.status,
      author: {
        id: this.authorId,
        name: this.authorName,
        email: this.authorEmail
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Post;
