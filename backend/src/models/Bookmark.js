/**
 * Bookmark Model
 * Handles all bookmark-related database operations
 */

const db = require('../../config/database-connection');
const logger = require('../utils/logger');

class Bookmark {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id;
    this.beritaId = data.berita_id;
    this.createdAt = data.created_at;
    
    // User information
    this.userName = data.user_name;
    this.userEmail = data.user_email;
    
    // News information
    this.beritaJudul = data.berita_judul;
    this.beritaSlug = data.berita_slug;
    this.beritaRingkasan = data.berita_ringkasan;
    this.beritaGambarUtama = data.berita_gambar_utama;
    this.beritaStatus = data.berita_status;
    this.beritaTanggalPublikasi = data.berita_tanggal_publikasi;
    
    // Category information
    this.kategoriNama = data.kategori_nama;
    this.kategoriSlug = data.kategori_slug;
    
    // Author information
    this.authorName = data.author_name;
  }

  /**
   * Create a new bookmark
   * @param {object} bookmarkData - Bookmark data
   * @returns {Promise<Bookmark>} - Created bookmark
   */
  static async create(bookmarkData) {
    try {
      const query = `
        INSERT INTO bookmark (user_id, berita_id, created_at)
        VALUES (?, ?, NOW())
      `;
      
      const result = await db.query(query, [
        bookmarkData.userId,
        bookmarkData.beritaId
      ]);

      const newBookmark = await Bookmark.findById(result.insertId);
      logger.info(`Bookmark created: User ${bookmarkData.userId} bookmarked news ${bookmarkData.beritaId}`);
      return newBookmark;
    } catch (error) {
      logger.error('Error creating bookmark:', error);
      throw error;
    }
  }

  /**
   * Find bookmark by ID
   * @param {number} id - Bookmark ID
   * @returns {Promise<Bookmark|null>} - Bookmark or null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT bm.*, 
               u.name as user_name, u.email as user_email,
               b.judul as berita_judul, b.slug as berita_slug, 
               b.ringkasan as berita_ringkasan, b.gambar_utama as berita_gambar_utama,
               b.status as berita_status, b.tanggal_publikasi as berita_tanggal_publikasi,
               k.nama as kategori_nama, k.slug as kategori_slug,
               au.name as author_name
        FROM bookmark bm
        LEFT JOIN users u ON bm.user_id = u.id
        LEFT JOIN berita b ON bm.berita_id = b.id
        LEFT JOIN kategori k ON b.kategori_id = k.id
        LEFT JOIN users au ON b.author_id = au.id
        WHERE bm.id = ?
      `;
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? new Bookmark(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding bookmark by ID:', error);
      throw error;
    }
  }

  /**
   * Find bookmark by user and news
   * @param {number} userId - User ID
   * @param {number} beritaId - News ID
   * @returns {Promise<Bookmark|null>} - Bookmark or null
   */
  static async findByUserAndBerita(userId, beritaId) {
    try {
      const query = `
        SELECT bm.*, 
               u.name as user_name, u.email as user_email,
               b.judul as berita_judul, b.slug as berita_slug, 
               b.ringkasan as berita_ringkasan, b.gambar_utama as berita_gambar_utama,
               b.status as berita_status, b.tanggal_publikasi as berita_tanggal_publikasi,
               k.nama as kategori_nama, k.slug as kategori_slug,
               au.name as author_name
        FROM bookmark bm
        LEFT JOIN users u ON bm.user_id = u.id
        LEFT JOIN berita b ON bm.berita_id = b.id
        LEFT JOIN kategori k ON b.kategori_id = k.id
        LEFT JOIN users au ON b.author_id = au.id
        WHERE bm.user_id = ? AND bm.berita_id = ?
      `;
      const rows = await db.query(query, [userId, beritaId]);
      
      return rows.length > 0 ? new Bookmark(rows[0]) : null;
    } catch (error) {
      logger.error('Error finding bookmark by user and news:', error);
      throw error;
    }
  }

  /**
   * Get bookmarks by user
   * @param {number} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} - Bookmarks and pagination info
   */
  static async findByUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc',
        kategoriId = null,
        search = ''
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE bm.user_id = ?';
      const queryParams = [userId];

      // Add category filter
      if (kategoriId) {
        whereClause += ' AND b.kategori_id = ?';
        queryParams.push(kategoriId);
      }

      // Add search filter
      if (search) {
        whereClause += ' AND (b.judul LIKE ? OR b.ringkasan LIKE ?)';
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      // Only show bookmarks for published news
      whereClause += ' AND b.status = "published"';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM bookmark bm
        LEFT JOIN berita b ON bm.berita_id = b.id
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult[0].total;

      // Get bookmarks
      const query = `
        SELECT bm.*, 
               u.name as user_name, u.email as user_email,
               b.judul as berita_judul, b.slug as berita_slug, 
               b.ringkasan as berita_ringkasan, b.gambar_utama as berita_gambar_utama,
               b.status as berita_status, b.tanggal_publikasi as berita_tanggal_publikasi,
               k.nama as kategori_nama, k.slug as kategori_slug,
               au.name as author_name
        FROM bookmark bm
        LEFT JOIN users u ON bm.user_id = u.id
        LEFT JOIN berita b ON bm.berita_id = b.id
        LEFT JOIN kategori k ON b.kategori_id = k.id
        LEFT JOIN users au ON b.author_id = au.id
        ${whereClause}
        ORDER BY bm.${this.validateSort(sort)} ${this.validateOrder(order)}
        LIMIT ? OFFSET ?
      `;

      queryParams.push(limit, offset);
      const rows = await db.query(query, queryParams);
      
      const bookmarks = rows.map(row => new Bookmark(row));

      return {
        bookmarks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error('Error finding bookmarks by user:', error);
      throw error;
    }
  }

  /**
   * Delete bookmark
   * @param {number} id - Bookmark ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM bookmark WHERE id = ?';
      const result = await db.query(query, [id]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`Bookmark deleted: ID ${id}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  /**
   * Delete bookmark by user and news
   * @param {number} userId - User ID
   * @param {number} beritaId - News ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteByUserAndBerita(userId, beritaId) {
    try {
      const query = 'DELETE FROM bookmark WHERE user_id = ? AND berita_id = ?';
      const result = await db.query(query, [userId, beritaId]);
      
      const success = result.affectedRows > 0;
      if (success) {
        logger.info(`Bookmark deleted: User ${userId}, News ${beritaId}`);
      }
      return success;
    } catch (error) {
      logger.error('Error deleting bookmark by user and news:', error);
      throw error;
    }
  }

  /**
   * Check if bookmark exists
   * @param {number} userId - User ID
   * @param {number} beritaId - News ID
   * @returns {Promise<boolean>} - Bookmark exists status
   */
  static async exists(userId, beritaId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM bookmark WHERE user_id = ? AND berita_id = ?';
      const result = await db.query(query, [userId, beritaId]);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error checking bookmark existence:', error);
      throw error;
    }
  }

  /**
   * Get bookmark statistics for user
   * @param {number} userId - User ID
   * @returns {Promise<object>} - Bookmark statistics
   */
  static async getStatsByUser(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_bookmarks,
          COUNT(CASE WHEN DATE(bm.created_at) = CURDATE() THEN 1 END) as bookmarks_today,
          COUNT(CASE WHEN bm.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as bookmarks_this_week,
          COUNT(CASE WHEN bm.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as bookmarks_this_month
        FROM bookmark bm
        LEFT JOIN berita b ON bm.berita_id = b.id
        WHERE bm.user_id = ? AND b.status = 'published'
      `;
      
      const result = await db.query(query, [userId]);
      return result[0];
    } catch (error) {
      logger.error('Error getting bookmark statistics:', error);
      throw error;
    }
  }

  /**
   * Convert bookmark to JSON
   * @returns {object} - Bookmark object
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      beritaId: this.beritaId,
      user: {
        name: this.userName,
        email: this.userEmail
      },
      berita: {
        judul: this.beritaJudul,
        slug: this.beritaSlug,
        ringkasan: this.beritaRingkasan,
        gambarUtama: this.beritaGambarUtama,
        status: this.beritaStatus,
        tanggalPublikasi: this.beritaTanggalPublikasi,
        kategori: {
          nama: this.kategoriNama,
          slug: this.kategoriSlug
        },
        author: {
          name: this.authorName
        }
      },
      createdAt: this.createdAt
    };
  }

  // Validation methods for SQL injection prevention
  static validateSort(sort) {
    const validSortFields = ['id', 'created_at'];
    return validSortFields.includes(sort) ? sort : 'created_at';
  }

  static validateOrder(order) {
    return ['asc', 'desc'].includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';
  }
}

module.exports = Bookmark;
