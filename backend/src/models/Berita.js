/**
 * Berita Model
 * Handles all news-related database operations
 */

const db = require('../../config/database-connection');
const logger = require('../utils/logger');

class Berita {
  constructor(data = {}) {
    this.id = data.id;
    this.judul = data.judul;
    this.slug = data.slug;
    this.konten = data.konten;
    this.ringkasan = data.ringkasan;
    this.gambarUtama = data.gambar_utama;
    this.tags = data.tags ? (typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags) : [];
    this.status = data.status || 'draft';
    this.tanggalPublikasi = data.tanggal_publikasi;
    this.viewsCount = data.views_count || 0;
    this.likesCount = data.likes_count || 0;
    this.sharesCount = data.shares_count || 0;
    
    // Author information
    this.authorId = data.author_id;
    this.authorName = data.author_name;
    this.authorEmail = data.author_email;
    
    // Category information
    this.kategoriId = data.kategori_id;
    this.kategoriNama = data.kategori_nama;
    this.kategoriSlug = data.kategori_slug;
    
    // Institution channel information
    this.kanalInstansiId = data.kanal_instansi_id;
    this.kanalInstansiNama = data.kanal_instansi_nama;
    this.kanalInstansiSlug = data.kanal_instansi_slug;
    
    // Metadata
    this.metaTitle = data.meta_title;
    this.metaDescription = data.meta_description;
    this.isFeatured = data.is_featured !== undefined ? data.is_featured : false;
    this.isBreakingNews = data.is_breaking_news !== undefined ? data.is_breaking_news : false;
    
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new news article
   * @param {object} beritaData - News data
   * @returns {Promise<Berita>} - Created news article
   */
  static async create(beritaData) {
    try {
      const query = `
        INSERT INTO berita (
          judul, slug, konten, ringkasan, gambar_utama, tags, status,
          tanggal_publikasi, author_id, kategori_id, kanal_instansi_id,
          meta_title, meta_description, is_featured, is_breaking_news,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const result = await db.query(query, [
        beritaData.judul,
        beritaData.slug,
        beritaData.konten,
        beritaData.ringkasan || null,
        beritaData.gambarUtama || null,
        JSON.stringify(beritaData.tags || []),
        beritaData.status || 'draft',
        beritaData.tanggalPublikasi || null,
        beritaData.authorId,
        beritaData.kategoriId,
        beritaData.kanalInstansiId || null,
        beritaData.metaTitle || null,
        beritaData.metaDescription || null,
        beritaData.isFeatured !== undefined ? beritaData.isFeatured : false,
        beritaData.isBreakingNews !== undefined ? beritaData.isBreakingNews : false
      ]);

      const newBerita = await Berita.findById(result.insertId);
      logger.info(`News article created: ${newBerita.judul} by user ${beritaData.authorId}`);
      return newBerita;
    } catch (error) {
      logger.error('Error creating news article:', error);
      throw error;
    }
  }

  /**
   * Find news article by ID
   * @param {number} id - News ID
   * @returns {Promise<Berita|null>} - News article or null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT b.*, 
               u.name as author_name, u.email as author_email,
               k.nama as kategori_nama, k.slug as kategori_slug,
               ki.nama as kanal_instansi_nama, ki.slug as kanal_instansi_slug
        FROM berita b
        LEFT JOIN users u ON b.author_id = u.id
        LEFT JOIN kategori k ON b.kategori_id = k.id
        LEFT JOIN kanal_instansi ki ON b.kanal_instansi_id = ki.id
        WHERE b.id = ?
      `;
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new Berita(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding news article by ID:', error);
      throw error;
    }
  }

  /**
   * Find news article by slug
   * @param {string} slug - News slug
   * @returns {Promise<Berita|null>} - News article or null
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT b.*, 
               u.name as author_name, u.email as author_email,
               k.nama as kategori_nama, k.slug as kategori_slug,
               ki.nama as kanal_instansi_nama, ki.slug as kanal_instansi_slug
        FROM berita b
        LEFT JOIN users u ON b.author_id = u.id
        LEFT JOIN kategori k ON b.kategori_id = k.id
        LEFT JOIN kanal_instansi ki ON b.kanal_instansi_id = ki.id
        WHERE b.slug = ?
      `;
      const rows = await db.query(query, [slug]);
      
      return rows.length > 0 ? new Berita(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding news article by slug:', error);
      throw error;
    }
  }

  /**
   * Get all news articles with pagination and filters
   * @param {object} options - Query options
   * @returns {Promise<object>} - News articles and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        search = '',
        kategoriId = null,
        status = null,
        authorId = null,
        kanalInstansiId = null,
        isFeatured = null,
        isBreakingNews = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      // Add search filter
      if (search) {
        whereClause += ' AND (b.judul LIKE ? OR b.konten LIKE ? OR b.ringkasan LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Add category filter
      if (kategoriId) {
        whereClause += ' AND b.kategori_id = ?';
        queryParams.push(kategoriId);
      }

      // Add status filter
      if (status) {
        whereClause += ' AND b.status = ?';
        queryParams.push(status);
      }

      // Add author filter
      if (authorId) {
        whereClause += ' AND b.author_id = ?';
        queryParams.push(authorId);
      }

      // Add institution channel filter
      if (kanalInstansiId) {
        whereClause += ' AND b.kanal_instansi_id = ?';
        queryParams.push(kanalInstansiId);
      }

      // Add featured filter
      if (isFeatured !== null) {
        whereClause += ' AND b.is_featured = ?';
        queryParams.push(isFeatured);
      }

      // Add breaking news filter
      if (isBreakingNews !== null) {
        whereClause += ' AND b.is_breaking_news = ?';
        queryParams.push(isBreakingNews);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM berita b ${whereClause}`;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get news articles
      // Validate sort and order parameters to prevent SQL injection
      const validSortFields = ['id', 'judul', 'slug', 'status', 'tanggal_publikasi', 'views_count', 'likes_count', 'shares_count', 'is_featured', 'is_breaking_news', 'created_at', 'updated_at'];
      const validSort = validSortFields.includes(sort) ? sort : 'created_at';
      const validOrder = ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      const query = `
        SELECT b.*,
               u.name as author_name, u.email as author_email,
               k.nama as kategori_nama, k.slug as kategori_slug,
               ki.nama as kanal_instansi_nama, ki.slug as kanal_instansi_slug
        FROM berita b
        LEFT JOIN users u ON b.author_id = u.id
        LEFT JOIN kategori k ON b.kategori_id = k.id
        LEFT JOIN kanal_instansi ki ON b.kanal_instansi_id = ki.id
        ${whereClause}
        ORDER BY b.${validSort} ${validOrder}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const articles = rows.map(row => new Berita(row));

      return {
        articles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding all news articles:', error);
      throw error;
    }
  }

  /**
   * Update news article
   * @param {number} id - News ID
   * @param {object} updateData - Data to update
   * @returns {Promise<Berita|null>} - Updated news article
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
            gambarUtama: 'gambar_utama',
            tanggalPublikasi: 'tanggal_publikasi',
            viewsCount: 'views_count',
            likesCount: 'likes_count',
            sharesCount: 'shares_count',
            authorId: 'author_id',
            kategoriId: 'kategori_id',
            kanalInstansiId: 'kanal_instansi_id',
            metaTitle: 'meta_title',
            metaDescription: 'meta_description',
            isFeatured: 'is_featured',
            isBreakingNews: 'is_breaking_news'
          };

          const fieldName = fieldMappings[key] || key;

          if (key === 'tags') {
            fields.push(`${fieldName} = ?`);
            values.push(JSON.stringify(updateData[key]));
          } else {
            fields.push(`${fieldName} = ?`);
            values.push(updateData[key]);
          }
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      const query = `UPDATE berita SET ${fields.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      const updatedBerita = await Berita.findById(id);
      logger.info(`News article updated: ${updatedBerita?.judul}`);
      return updatedBerita;
    } catch (error) {
      logger.error('Error updating news article:', error);
      throw error;
    }
  }

  /**
   * Delete news article
   * @param {number} id - News ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM berita WHERE id = ?';
      const result = await db.query(query, [id]);

      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`News article deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting news article:', error);
      throw error;
    }
  }

  /**
   * Increment views count
   * @param {number} id - News ID
   * @returns {Promise<boolean>} - Success status
   */
  static async incrementViews(id) {
    try {
      const query = 'UPDATE berita SET views_count = views_count + 1 WHERE id = ?';
      const result = await db.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error incrementing views:', error);
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
      let query = 'SELECT COUNT(*) as count FROM berita WHERE slug = ?';
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
   * Convert news article to JSON
   * @returns {object} - News article object
   */
  toJSON() {
    return {
      id: this.id,
      judul: this.judul,
      slug: this.slug,
      konten: this.konten,
      ringkasan: this.ringkasan,
      gambarUtama: this.gambarUtama,
      tags: this.tags,
      status: this.status,
      tanggalPublikasi: this.tanggalPublikasi,
      viewsCount: this.viewsCount,
      likesCount: this.likesCount,
      sharesCount: this.sharesCount,
      author: {
        id: this.authorId,
        name: this.authorName,
        email: this.authorEmail
      },
      kategori: {
        id: this.kategoriId,
        nama: this.kategoriNama,
        slug: this.kategoriSlug
      },
      kanalInstansi: this.kanalInstansiId ? {
        id: this.kanalInstansiId,
        nama: this.kanalInstansiNama,
        slug: this.kanalInstansiSlug
      } : null,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      isFeatured: this.isFeatured,
      isBreakingNews: this.isBreakingNews,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Berita;
