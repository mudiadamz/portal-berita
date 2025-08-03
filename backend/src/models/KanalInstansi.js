/**
 * KanalInstansi Model
 * Handles all institution channel-related database operations
 */

const db = require('../../config/database-connection');
const logger = require('../utils/logger');

class KanalInstansi {
  constructor(data = {}) {
    this.id = data.id;
    this.nama = data.nama;
    this.deskripsi = data.deskripsi;
    this.slug = data.slug;
    this.logoUrl = data.logo_url;
    this.websiteUrl = data.website_url;
    this.contactEmail = data.contact_email;
    this.contactPhone = data.contact_phone;
    this.alamat = data.alamat;
    this.userId = data.user_id;
    this.userName = data.user_name;
    this.userEmail = data.user_email;
    this.isVerified = data.is_verified !== undefined ? data.is_verified : false;
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new institution channel
   * @param {object} kanalData - Channel data
   * @returns {Promise<KanalInstansi>} - Created channel
   */
  static async create(kanalData) {
    try {
      const query = `
        INSERT INTO kanal_instansi (
          nama, deskripsi, slug, logo_url, website_url, 
          contact_email, contact_phone, alamat, user_id, 
          is_verified, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const result = await db.query(query, [
        kanalData.nama,
        kanalData.deskripsi || null,
        kanalData.slug,
        kanalData.logoUrl || null,
        kanalData.websiteUrl || null,
        kanalData.contactEmail || null,
        kanalData.contactPhone || null,
        kanalData.alamat || null,
        kanalData.userId,
        kanalData.isVerified !== undefined ? kanalData.isVerified : false,
        kanalData.isActive !== undefined ? kanalData.isActive : true
      ]);

      const newKanal = await KanalInstansi.findById(result.insertId);
      logger.info(`Institution channel created: ${newKanal.nama} by user ${kanalData.userId}`);
      return newKanal;
    } catch (error) {
      logger.error('Error creating institution channel:', error);
      throw error;
    }
  }

  /**
   * Find channel by ID
   * @param {number} id - Channel ID
   * @returns {Promise<KanalInstansi|null>} - Channel or null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT k.*, u.name as user_name, u.email as user_email
        FROM kanal_instansi k
        LEFT JOIN users u ON k.user_id = u.id
        WHERE k.id = ?
      `;
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new KanalInstansi(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding channel by ID:', error);
      throw error;
    }
  }

  /**
   * Find channel by slug
   * @param {string} slug - Channel slug
   * @returns {Promise<KanalInstansi|null>} - Channel or null
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT k.*, u.name as user_name, u.email as user_email
        FROM kanal_instansi k
        LEFT JOIN users u ON k.user_id = u.id
        WHERE k.slug = ?
      `;
      const rows = await db.query(query, [slug]);
      
      return rows.length > 0 ? new KanalInstansi(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding channel by slug:', error);
      throw error;
    }
  }

  /**
   * Get all channels with pagination and filters
   * @param {object} options - Query options
   * @returns {Promise<object>} - Channels and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
        isVerified = null,
        isActive = null,
        userId = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      // Add search filter
      if (search) {
        whereClause += ' AND (k.nama LIKE ? OR k.deskripsi LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Add verified filter
      if (isVerified !== null) {
        whereClause += ' AND k.is_verified = ?';
        queryParams.push(isVerified);
      }

      // Add active filter
      if (isActive !== null) {
        whereClause += ' AND k.is_active = ?';
        queryParams.push(isActive);
      }

      // Add user filter
      if (userId) {
        whereClause += ' AND k.user_id = ?';
        queryParams.push(userId);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM kanal_instansi k ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Validate sort and order parameters to prevent SQL injection
      const validSortFields = ['id', 'nama', 'deskripsi', 'slug', 'is_verified', 'is_active', 'created_at', 'updated_at'];
      const validSort = validSortFields.includes(sort) ? sort : 'created_at';
      const validOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      // Get channels
      const query = `
        SELECT k.*, u.name as user_name, u.email as user_email
        FROM kanal_instansi k
        LEFT JOIN users u ON k.user_id = u.id
        ${whereClause}
        ORDER BY k.${validSort} ${validOrder}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const channels = rows.map(row => new KanalInstansi(row));

      return {
        channels,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding all channels:', error);
      throw error;
    }
  }

  /**
   * Update channel
   * @param {number} id - Channel ID
   * @param {object} updateData - Data to update
   * @returns {Promise<KanalInstansi|null>} - Updated channel
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
            logoUrl: 'logo_url',
            websiteUrl: 'website_url',
            contactEmail: 'contact_email',
            contactPhone: 'contact_phone',
            userId: 'user_id',
            isVerified: 'is_verified',
            isActive: 'is_active'
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

      const query = `UPDATE kanal_instansi SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedKanal = await KanalInstansi.findById(id);
      logger.info(`Institution channel updated: ${updatedKanal?.nama}`);
      return updatedKanal;
    } catch (error) {
      logger.error('Error updating channel:', error);
      throw error;
    }
  }

  /**
   * Delete channel
   * @param {number} id - Channel ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM kanal_instansi WHERE id = ?';
      const result = await db.query(query, [id]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`Institution channel deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting channel:', error);
      throw error;
    }
  }

  /**
   * Check if slug exists
   * @param {string} slug - Slug to check
   * @param {number} excludeId - ID to exclude from check
   * @returns {Promise<boolean>} - Slug exists status
   */
  static async slugExists(slug, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM kanal_instansi WHERE slug = ?';
      const params = [slug];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await db.query(query, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error checking slug existence:', error);
      throw error;
    }
  }

  /**
   * Get verified and active channels
   * @returns {Promise<Array>} - Array of verified channels
   */
  static async getVerifiedChannels() {
    try {
      const query = `
        SELECT k.*, u.name as user_name, u.email as user_email
        FROM kanal_instansi k
        LEFT JOIN users u ON k.user_id = u.id
        WHERE k.is_verified = 1 AND k.is_active = 1
        ORDER BY k.nama ASC
      `;
      const rows = await db.query(query);
      return rows.map(row => new KanalInstansi(row));
    } catch (error) {
      logger.error('Error getting verified channels:', error);
      throw error;
    }
  }

  /**
   * Get channels by user
   * @param {number} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Channels and pagination info
   */
  static async findByUser(userId, options = {}) {
    return KanalInstansi.findAll({ ...options, userId });
  }

  /**
   * Convert channel to JSON
   * @returns {object} - Channel object
   */
  toJSON() {
    return {
      id: this.id,
      nama: this.nama,
      deskripsi: this.deskripsi,
      slug: this.slug,
      logoUrl: this.logoUrl,
      websiteUrl: this.websiteUrl,
      contactEmail: this.contactEmail,
      contactPhone: this.contactPhone,
      alamat: this.alamat,
      owner: {
        id: this.userId,
        name: this.userName,
        email: this.userEmail
      },
      isVerified: this.isVerified,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = KanalInstansi;
