/**
 * Kategori Controller
 * Handles category management operations
 */

const Kategori = require('../models/Kategori');
const { sendSuccess, sendError, sendNotFound, sendConflict } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all categories
 * @route GET /api/kategori
 * @access Public
 */
const getAllKategori = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'nama',
    order = 'asc',
    search = '',
    isActive = null
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    isActive: isActive !== null ? isActive === 'true' : null
  };

  const result = await Kategori.findAll(options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Categories retrieved successfully', {
    categories: result.categories.map(kategori => kategori.toJSON())
  }, meta);
});

/**
 * Get category by ID
 * @route GET /api/kategori/:id
 * @access Public
 */
const getKategoriById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kategori = await Kategori.findById(id);
  
  if (!kategori) {
    return sendNotFound(res, 'Category not found');
  }

  sendSuccess(res, 200, 'Category retrieved successfully', {
    category: kategori.toJSON()
  });
});

/**
 * Get category by slug
 * @route GET /api/kategori/slug/:slug
 * @access Public
 */
const getKategoriBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const kategori = await Kategori.findBySlug(slug);
  
  if (!kategori) {
    return sendNotFound(res, 'Category not found');
  }

  sendSuccess(res, 200, 'Category retrieved successfully', {
    category: kategori.toJSON()
  });
});

/**
 * Create new category
 * @route POST /api/kategori
 * @access Private (Admin only)
 */
const createKategori = asyncHandler(async (req, res) => {
  const { nama, deskripsi, slug, isActive } = req.body;

  // Check if slug already exists
  const existingKategori = await Kategori.findBySlug(slug);
  if (existingKategori) {
    return sendConflict(res, 'Category with this slug already exists');
  }

  // Create new category
  const kategoriData = { nama, deskripsi, slug, isActive };
  const kategori = await Kategori.create(kategoriData);

  logger.info(`Category created: ${nama} by admin ${req.user.id}`);

  sendSuccess(res, 201, 'Category created successfully', {
    category: kategori.toJSON()
  });
});

/**
 * Update category
 * @route PUT /api/kategori/:id
 * @access Private (Admin only)
 */
const updateKategori = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nama, deskripsi, slug, isActive } = req.body;

  // Check if category exists
  const existingKategori = await Kategori.findById(id);
  if (!existingKategori) {
    return sendNotFound(res, 'Category not found');
  }

  // Check if slug is being changed and if it already exists
  if (slug && slug !== existingKategori.slug) {
    const slugExists = await Kategori.slugExists(slug, id);
    if (slugExists) {
      return sendConflict(res, 'Slug already in use');
    }
  }

  // Prepare update data
  const updateData = {};
  if (nama !== undefined) updateData.nama = nama;
  if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
  if (slug !== undefined) updateData.slug = slug;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update category
  const updatedKategori = await Kategori.update(id, updateData);

  logger.info(`Category updated: ${updatedKategori.nama} by admin ${req.user.id}`);

  sendSuccess(res, 200, 'Category updated successfully', {
    category: updatedKategori.toJSON()
  });
});

/**
 * Delete category
 * @route DELETE /api/kategori/:id
 * @access Private (Admin only)
 */
const deleteKategori = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category exists
  const existingKategori = await Kategori.findById(id);
  if (!existingKategori) {
    return sendNotFound(res, 'Category not found');
  }

  // Check if category is being used by any news articles
  const db = require('../../config/database-connection');
  const newsCount = await db.query('SELECT COUNT(*) as count FROM berita WHERE kategori_id = ?', [id]);
  
  if (newsCount[0].count > 0) {
    return sendError(res, 400, 'Cannot delete category that is being used by news articles');
  }

  // Delete category
  const success = await Kategori.delete(id);
  
  if (!success) {
    return sendError(res, 500, 'Failed to delete category');
  }

  logger.info(`Category deleted: ${existingKategori.nama} by admin ${req.user.id}`);

  sendSuccess(res, 200, 'Category deleted successfully');
});

/**
 * Get active categories only
 * @route GET /api/kategori/active
 * @access Public
 */
const getActiveKategori = asyncHandler(async (req, res) => {
  const categories = await Kategori.getActiveCategories();

  sendSuccess(res, 200, 'Active categories retrieved successfully', {
    categories: categories.map(kategori => kategori.toJSON())
  });
});

/**
 * Get category statistics
 * @route GET /api/kategori/stats
 * @access Private (Admin only)
 */
const getKategoriStats = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');
  
  // Get category statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as total_categories,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_categories,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_categories,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as categories_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as categories_this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as categories_this_month
    FROM kategori
  `;
  
  const stats = await db.query(statsQuery);

  // Get category usage statistics
  const usageQuery = `
    SELECT k.nama, k.slug, COUNT(b.id) as news_count
    FROM kategori k
    LEFT JOIN berita b ON k.id = b.kategori_id
    WHERE k.is_active = 1
    GROUP BY k.id, k.nama, k.slug
    ORDER BY news_count DESC
    LIMIT 10
  `;
  
  const usage = await db.query(usageQuery);

  sendSuccess(res, 200, 'Category statistics retrieved successfully', {
    stats: stats[0],
    topCategories: usage
  });
});

module.exports = {
  getAllKategori,
  getKategoriById,
  getKategoriBySlug,
  createKategori,
  updateKategori,
  deleteKategori,
  getActiveKategori,
  getKategoriStats
};
