/**
 * Kategori Routes
 * Routes for category management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllKategori,
  getKategoriById,
  getKategoriBySlug,
  createKategori,
  updateKategori,
  deleteKategori,
  getActiveKategori,
  getKategoriStats
} = require('../controllers/kategoriController');

// Import middleware
const { authenticate, adminOnly } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { kategoriSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Category ID must be a number',
    'number.integer': 'Category ID must be an integer',
    'number.positive': 'Category ID must be positive',
    'any.required': 'Category ID is required'
  })
});

const slugParamSchema = Joi.object({
  slug: Joi.string().min(2).max(120).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.min': 'Slug must be at least 2 characters long',
    'string.max': 'Slug cannot exceed 120 characters',
    'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    'any.required': 'Slug is required'
  })
});

// Extended query schema for categories
const kategoriQuerySchema = querySchemas.pagination.keys({
  search: Joi.string().min(1).max(100).messages({
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  isActive: Joi.string().valid('true', 'false')
});

/**
 * @route   GET /api/kategori/stats
 * @desc    Get category statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  authenticate,
  adminOnly,
  readLimiter,
  getKategoriStats
);

/**
 * @route   GET /api/kategori/active
 * @desc    Get active categories only
 * @access  Public
 */
router.get('/active',
  readLimiter,
  getActiveKategori
);

/**
 * @route   GET /api/kategori/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug',
  readLimiter,
  validateParams(slugParamSchema),
  getKategoriBySlug
);

/**
 * @route   GET /api/kategori
 * @desc    Get all categories with pagination and filtering
 * @access  Public
 */
router.get('/',
  readLimiter,
  validateQuery(kategoriQuerySchema),
  getAllKategori
);

/**
 * @route   GET /api/kategori/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/:id',
  readLimiter,
  validateParams(idParamSchema),
  getKategoriById
);

/**
 * @route   POST /api/kategori
 * @desc    Create new category
 * @access  Private (Admin only)
 */
router.post('/',
  authenticate,
  adminOnly,
  writeLimiter,
  validateBody(kategoriSchemas.create),
  createKategori
);

/**
 * @route   PUT /api/kategori/:id
 * @desc    Update category
 * @access  Private (Admin only)
 */
router.put('/:id',
  authenticate,
  adminOnly,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(kategoriSchemas.update),
  updateKategori
);

/**
 * @route   DELETE /api/kategori/:id
 * @desc    Delete category
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  adminOnly,
  writeLimiter,
  validateParams(idParamSchema),
  deleteKategori
);

module.exports = router;
