/**
 * Bookmark Routes
 * Routes for bookmark management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getBookmarks,
  getBookmarkById,
  createBookmark,
  deleteBookmark,
  deleteBookmarkByArticle,
  checkBookmark,
  getBookmarkStats,
  getBookmarksByCategory,
  getRecentBookmarks,
  bulkDeleteBookmarks
} = require('../controllers/bookmarkController');

// Import middleware
const { authenticate } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { bookmarkSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Bookmark ID must be a number',
    'number.integer': 'Bookmark ID must be an integer',
    'number.positive': 'Bookmark ID must be positive',
    'any.required': 'Bookmark ID is required'
  })
});

const beritaIdParamSchema = Joi.object({
  beritaId: Joi.number().integer().positive().required().messages({
    'number.base': 'News ID must be a number',
    'number.integer': 'News ID must be an integer',
    'number.positive': 'News ID must be positive',
    'any.required': 'News ID is required'
  })
});

// Extended query schema for bookmarks
const bookmarkQuerySchema = querySchemas.pagination.keys({
  search: Joi.string().min(1).max(100).messages({
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  kategoriId: Joi.number().integer().positive()
});

// Bulk delete schema
const bulkDeleteSchema = Joi.object({
  bookmarkIds: Joi.array().items(
    Joi.number().integer().positive()
  ).min(1).max(50).required().messages({
    'array.min': 'At least one bookmark ID is required',
    'array.max': 'Maximum 50 bookmarks can be deleted at once',
    'any.required': 'Bookmark IDs are required'
  })
});

/**
 * @route   GET /api/bookmarks/stats
 * @desc    Get bookmark statistics for current user
 * @access  Private (Authenticated users)
 */
router.get('/stats',
  authenticate,
  readLimiter,
  getBookmarkStats
);

/**
 * @route   GET /api/bookmarks/by-category
 * @desc    Get bookmarked articles by category
 * @access  Private (Authenticated users)
 */
router.get('/by-category',
  authenticate,
  readLimiter,
  getBookmarksByCategory
);

/**
 * @route   GET /api/bookmarks/recent
 * @desc    Get recently bookmarked articles
 * @access  Private (Authenticated users)
 */
router.get('/recent',
  authenticate,
  readLimiter,
  validateQuery(Joi.object({
    limit: Joi.number().integer().min(1).max(20).default(5)
  })),
  getRecentBookmarks
);

/**
 * @route   GET /api/bookmarks/check/:beritaId
 * @desc    Check if article is bookmarked
 * @access  Private (Authenticated users)
 */
router.get('/check/:beritaId',
  authenticate,
  readLimiter,
  validateParams(beritaIdParamSchema),
  checkBookmark
);

/**
 * @route   GET /api/bookmarks
 * @desc    Get user's bookmarks
 * @access  Private (Authenticated users)
 */
router.get('/',
  authenticate,
  readLimiter,
  validateQuery(bookmarkQuerySchema),
  getBookmarks
);

/**
 * @route   GET /api/bookmarks/:id
 * @desc    Get bookmark by ID
 * @access  Private (Bookmark owner only)
 */
router.get('/:id',
  authenticate,
  readLimiter,
  validateParams(idParamSchema),
  getBookmarkById
);

/**
 * @route   POST /api/bookmarks
 * @desc    Add bookmark
 * @access  Private (Authenticated users)
 */
router.post('/',
  authenticate,
  writeLimiter,
  validateBody(bookmarkSchemas.create),
  createBookmark
);

/**
 * @route   DELETE /api/bookmarks/bulk
 * @desc    Bulk remove bookmarks
 * @access  Private (Authenticated users)
 */
router.delete('/bulk',
  authenticate,
  writeLimiter,
  validateBody(bulkDeleteSchema),
  bulkDeleteBookmarks
);

/**
 * @route   DELETE /api/bookmarks/article/:beritaId
 * @desc    Remove bookmark by article ID
 * @access  Private (Authenticated users)
 */
router.delete('/article/:beritaId',
  authenticate,
  writeLimiter,
  validateParams(beritaIdParamSchema),
  deleteBookmarkByArticle
);

/**
 * @route   DELETE /api/bookmarks/:id
 * @desc    Remove bookmark
 * @access  Private (Bookmark owner only)
 */
router.delete('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  deleteBookmark
);

module.exports = router;
