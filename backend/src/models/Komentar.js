/**
 * Komentar Model
 * Handles all comment-related database operations
 */

const db = require('../../config/database-connection');
const logger = require('../utils/logger');

class Komentar {
  constructor(data = {}) {
    this.id = data.id;
    this.konten = data.konten;
    this.beritaId = data.berita_id;
    this.userId = data.user_id;
    this.parentId = data.parent_id;
    this.isApproved = data.is_approved !== undefined ? data.is_approved : true;
    this.isReported = data.is_reported !== undefined ? data.is_reported : false;
    this.likesCount = data.likes_count || 0;
    
    // User information
    this.userName = data.user_name;
    this.userEmail = data.user_email;
    
    // News information
    this.beritaJudul = data.berita_judul;
    this.beritaSlug = data.berita_slug;
    
    // Parent comment information
    this.parentKonten = data.parent_konten;
    this.parentUserName = data.parent_user_name;
    
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new comment
   * @param {object} komentarData - Comment data
   * @returns {Promise<Komentar>} - Created comment
   */
  static async create(komentarData) {
    try {
      const query = `
        INSERT INTO komentar (
          konten, berita_id, user_id, parent_id, 
          is_approved, is_reported, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const result = await db.query(query, [
        komentarData.konten,
        komentarData.beritaId,
        komentarData.userId,
        komentarData.parentId || null,
        komentarData.isApproved !== undefined ? komentarData.isApproved : true,
        komentarData.isReported !== undefined ? komentarData.isReported : false
      ]);

      const newKomentar = await Komentar.findById(result.insertId);
      logger.info(`Comment created on news ${komentarData.beritaId} by user ${komentarData.userId}`);
      return newKomentar;
    } catch (error) {
      logger.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Find comment by ID
   * @param {number} id - Comment ID
   * @returns {Promise<Komentar|null>} - Comment or null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT k.*, 
               u.name as user_name, u.email as user_email,
               b.judul as berita_judul, b.slug as berita_slug,
               pk.konten as parent_konten, pu.name as parent_user_name
        FROM komentar k
        LEFT JOIN users u ON k.user_id = u.id
        LEFT JOIN berita b ON k.berita_id = b.id
        LEFT JOIN komentar pk ON k.parent_id = pk.id
        LEFT JOIN users pu ON pk.user_id = pu.id
        WHERE k.id = ?
      `;
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new Komentar(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding comment by ID:', error);
      throw error;
    }
  }

  /**
   * Get comments for a news article
   * @param {number} beritaId - News article ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Comments and pagination info
   */
  static async findByBerita(beritaId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'created_at',
        order = 'asc',
        isApproved = true,
        parentId = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE k.berita_id = ?';
      const queryParams = [beritaId];

      // Add approved filter
      if (isApproved !== null) {
        whereClause += ' AND k.is_approved = ?';
        queryParams.push(isApproved);
      }

      // Add parent filter (for nested comments)
      if (parentId !== null) {
        whereClause += ' AND k.parent_id = ?';
        queryParams.push(parentId);
      } else {
        whereClause += ' AND k.parent_id IS NULL';
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM komentar k ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get comments
      const query = `
        SELECT k.*, 
               u.name as user_name, u.email as user_email,
               b.judul as berita_judul, b.slug as berita_slug,
               pk.konten as parent_konten, pu.name as parent_user_name
        FROM komentar k
        LEFT JOIN users u ON k.user_id = u.id
        LEFT JOIN berita b ON k.berita_id = b.id
        LEFT JOIN komentar pk ON k.parent_id = pk.id
        LEFT JOIN users pu ON pk.user_id = pu.id
        ${whereClause}
        ORDER BY k.${this.validateSort(sort)} ${this.validateOrder(order)}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const comments = rows.map(row => new Komentar(row));

      // Get replies for each comment if this is top-level
      if (parentId === null) {
        for (let comment of comments) {
          const replies = await Komentar.findByBerita(beritaId, {
            parentId: comment.id,
            limit: 10,
            isApproved
          });
          comment.replies = replies.comments;
        }
      }

      return {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding comments by news article:', error);
      throw error;
    }
  }

  /**
   * Get comments by user
   * @param {number} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Comments and pagination info
   */
  static async findByUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc'
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = 'WHERE k.user_id = ?';
      const queryParams = [userId];

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM komentar k ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get comments
      const query = `
        SELECT k.*, 
               u.name as user_name, u.email as user_email,
               b.judul as berita_judul, b.slug as berita_slug,
               pk.konten as parent_konten, pu.name as parent_user_name
        FROM komentar k
        LEFT JOIN users u ON k.user_id = u.id
        LEFT JOIN berita b ON k.berita_id = b.id
        LEFT JOIN komentar pk ON k.parent_id = pk.id
        LEFT JOIN users pu ON pk.user_id = pu.id
        ${whereClause}
        ORDER BY k.${this.validateSort(sort)} ${this.validateOrder(order)}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const comments = rows.map(row => new Komentar(row));

      return {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding comments by user:', error);
      throw error;
    }
  }

  /**
   * Update comment
   * @param {number} id - Comment ID
   * @param {object} updateData - Data to update
   * @returns {Promise<Komentar|null>} - Updated comment
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          // Handle special field mappings
          const fieldMappings = {
            beritaId: 'berita_id',
            userId: 'user_id',
            parentId: 'parent_id',
            isApproved: 'is_approved',
            isReported: 'is_reported',
            likesCount: 'likes_count'
          };

          const fieldName = fieldMappings[key] || key;
          fields.push(`${fieldName} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      const query = `UPDATE komentar SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedKomentar = await Komentar.findById(id);
      logger.info(`Comment updated: ID ${id}`);
      return updatedKomentar;
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   * @param {number} id - Comment ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM komentar WHERE id = ?';
      const result = await db.query(query, [id]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`Comment deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Convert comment to JSON
   * @returns {object} - Comment object
   */
  toJSON() {
    return {
      id: this.id,
      konten: this.konten,
      beritaId: this.beritaId,
      userId: this.userId,
      parentId: this.parentId,
      isApproved: this.isApproved,
      isReported: this.isReported,
      likesCount: this.likesCount,
      user: {
        name: this.userName,
        email: this.userEmail
      },
      berita: {
        judul: this.beritaJudul,
        slug: this.beritaSlug
      },
      parent: this.parentId ? {
        konten: this.parentKonten,
        userName: this.parentUserName
      } : null,
      replies: this.replies || [],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validation methods for SQL injection prevention
  static validateSort(sort) {
    const validSortFields = ['id', 'konten', 'is_approved', 'is_reported', 'likes_count', 'created_at', 'updated_at'];
    return validSortFields.includes(sort) ? sort : 'created_at';
  }

  static validateOrder(order) {
    return ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
  }
}

module.exports = Komentar;
