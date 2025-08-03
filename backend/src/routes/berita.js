/**
 * Berita Routes
 * Routes for news management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllBerita,
  getBeritaById,
  getBeritaBySlug,
  createBerita,
  updateBerita,
  updateBeritaStatus,
  deleteBerita,
  getMyBerita,
  getBeritaStats
} = require('../controllers/beritaController');

// Import middleware
const { authenticate, optionalAuth, adminOnly, canManageNews, canPublishNews } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { beritaSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'News ID must be a number',
    'number.integer': 'News ID must be an integer',
    'number.positive': 'News ID must be positive',
    'any.required': 'News ID is required'
  })
});

const slugParamSchema = Joi.object({
  slug: Joi.string().min(5).max(280).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.min': 'Slug must be at least 5 characters long',
    'string.max': 'Slug cannot exceed 280 characters',
    'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    'any.required': 'Slug is required'
  })
});

// Extended query schema for news
const beritaQuerySchema = querySchemas.pagination.keys({
  search: Joi.string().min(1).max(100).messages({
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  kategoriId: Joi.number().integer().positive(),
  status: Joi.string().valid('draft', 'review', 'published', 'rejected', 'archived'),
  authorId: Joi.number().integer().positive(),
  kanalInstansiId: Joi.number().integer().positive(),
  isFeatured: Joi.string().valid('true', 'false'),
  isBreakingNews: Joi.string().valid('true', 'false')
});

/**
 * @route   GET /api/berita/stats
 * @desc    Get news statistics
 * @access  Private (Admin, Jurnalis)
 */
router.get('/stats',
  authenticate,
  canPublishNews,
  readLimiter,
  getBeritaStats
);

/**
 * @route   GET /api/berita/my-articles
 * @desc    Get current user's articles
 * @access  Private
 */
router.get('/my-articles',
  authenticate,
  readLimiter,
  validateQuery(beritaQuerySchema),
  getMyBerita
);

/**
 * @route   GET /api/berita/slug/:slug
 * @desc    Get news by slug
 * @access  Public (but shows only published for non-authenticated users)
 */
router.get('/slug/:slug',
  optionalAuth,
  readLimiter,
  validateParams(slugParamSchema),
  getBeritaBySlug
);

/**
 * @route   GET /api/berita
 * @desc    Get all news with pagination and filtering
 * @access  Public (but shows only published for non-authenticated users)
 */
router.get('/',
  optionalAuth,
  readLimiter,
  validateQuery(beritaQuerySchema),
  getAllBerita
);

/**
 * @route   GET /api/berita/:id
 * @desc    Get news by ID
 * @access  Public (but shows only published for non-authenticated users)
 */
router.get('/:id',
  optionalAuth,
  readLimiter,
  validateParams(idParamSchema),
  getBeritaById
);

/**
 * @route   POST /api/berita
 * @desc    Create new news article
 * @access  Private (Jurnalis, Admin, Instansi roles)
 */
router.post('/',
  authenticate,
  canManageNews,
  writeLimiter,
  validateBody(beritaSchemas.create),
  createBerita
);

/**
 * @route   PUT /api/berita/:id
 * @desc    Update news article
 * @access  Private (Admin, Jurnalis, or Article Author)
 */
router.put('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(beritaSchemas.update),
  updateBerita
);

/**
 * @route   PUT /api/berita/:id/status
 * @desc    Update news article status
 * @access  Private (Admin, Jurnalis for workflow management)
 */
router.put('/:id/status',
  authenticate,
  canPublishNews,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(beritaSchemas.updateStatus),
  updateBeritaStatus
);

/**
 * @route   DELETE /api/berita/:id
 * @desc    Delete news article
 * @access  Private (Admin, Jurnalis, or Article Author)
 */
router.delete('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  deleteBerita
);

module.exports = router;
