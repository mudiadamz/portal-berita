/**
 * Kategori Model
 * Handles all category-related database operations
 */

const db = require('../../config/database-connection');
const logger = require('../utils/logger');

class Kategori {
  constructor(data = {}) {
    this.id = data.id;
    this.nama = data.nama;
    this.deskripsi = data.deskripsi;
    this.slug = data.slug;
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new category
   * @param {object} kategoriData - Category data
   * @returns {Promise<Kategori>} - Created category
   */
  static async create(kategoriData) {
    try {
      const query = `
        INSERT INTO kategori (nama, deskripsi, slug, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      
      const result = await db.query(query, [
        kategoriData.nama,
        kategoriData.deskripsi || null,
        kategoriData.slug,
        kategoriData.isActive !== undefined ? kategoriData.isActive : true
      ]);

      const newKategori = await Kategori.findById(result.insertId);
      logger.info(`Category created: ${newKategori.nama}`);
      return newKategori;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Find category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Kategori|null>} - Category or null
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM kategori WHERE id = ?';
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new Kategori(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding category by ID:', error);
      throw error;
    }
  }

  /**
   * Find category by slug
   * @param {string} slug - Category slug
   * @returns {Promise<Kategori|null>} - Category or null
   */
  static async findBySlug(slug) {
    try {
      const query = 'SELECT * FROM kategori WHERE slug = ?';
      const rows = await db.query(query, [slug]);
      
      return rows.length > 0 ? new Kategori(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding category by slug:', error);
      throw error;
    }
  }

  /**
   * Get all categories with pagination
   * @param {object} options - Query options
   * @returns {Promise<object>} - Categories and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
        isActive = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      // Add search filter
      if (search) {
        whereClause += ' AND (nama LIKE ? OR deskripsi LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Add active filter
      if (isActive !== null) {
        whereClause += ' AND is_active = ?';
        queryParams.push(isActive);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM kategori ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Validate sort and order parameters to prevent SQL injection
      const validSortFields = ['id', 'nama', 'deskripsi', 'slug', 'is_active', 'created_at', 'updated_at'];
      const validSort = validSortFields.includes(sort) ? sort : 'created_at';
      const validOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      // Get categories
      const query = `
        SELECT * FROM kategori ${whereClause}
        ORDER BY ${validSort} ${validOrder}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const categories = rows.map(row => new Kategori(row));

      return {
        categories,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding all categories:', error);
      throw error;
    }
  }

  /**
   * Update category
   * @param {number} id - Category ID
   * @param {object} updateData - Data to update
   * @returns {Promise<Kategori|null>} - Updated category
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
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

      const query = `UPDATE kategori SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedKategori = await Kategori.findById(id);
      logger.info(`Category updated: ${updatedKategori?.nama}`);
      return updatedKategori;
    } catch (error) {
      logger.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete category
   * @param {number} id - Category ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM kategori WHERE id = ?';
      const result = await db.query(query, [id]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`Category deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting category:', error);
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
      let query = 'SELECT COUNT(*) as count FROM kategori WHERE slug = ?';
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
   * Get active categories only
   * @returns {Promise<Array>} - Array of active categories
   */
  static async getActiveCategories() {
    try {
      const query = 'SELECT * FROM kategori WHERE is_active = 1 ORDER BY nama ASC';
      const rows = await db.query(query);
      return rows.map(row => new Kategori(row));
    } catch (error) {
      logger.error('Error getting active categories:', error);
      throw error;
    }
  }

  /**
   * Convert category to JSON
   * @returns {object} - Category object
   */
  toJSON() {
    return {
      id: this.id,
      nama: this.nama,
      deskripsi: this.deskripsi,
      slug: this.slug,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Kategori;
