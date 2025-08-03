/**
 * Komentar Routes
 * Routes for comment management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getKomentarByBerita,
  createKomentar,
  updateKomentar,
  deleteKomentar,
  getMyKomentar,
  getKomentarById,
  reportKomentar,
  getKomentarStats
} = require('../controllers/komentarController');

// Import middleware
const { authenticate, optionalAuth, adminOnly } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { komentarSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Comment ID must be a number',
    'number.integer': 'Comment ID must be an integer',
    'number.positive': 'Comment ID must be positive',
    'any.required': 'Comment ID is required'
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

// Extended query schema for comments
const komentarQuerySchema = querySchemas.pagination.keys({
  sort: Joi.string().valid('created_at', 'updated_at', 'likes_count').default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('asc')
});

/**
 * @route   GET /api/komentar/stats
 * @desc    Get comment statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  authenticate,
  adminOnly,
  readLimiter,
  getKomentarStats
);

/**
 * @route   GET /api/komentar/my-comments
 * @desc    Get current user's comments
 * @access  Private
 */
router.get('/my-comments',
  authenticate,
  readLimiter,
  validateQuery(komentarQuerySchema),
  getMyKomentar
);

/**
 * @route   GET /api/komentar/:id
 * @desc    Get comment by ID
 * @access  Public (for approved comments) / Private (for own comments or admin)
 */
router.get('/:id',
  optionalAuth,
  readLimiter,
  validateParams(idParamSchema),
  getKomentarById
);

/**
 * @route   PUT /api/komentar/:id
 * @desc    Update comment
 * @access  Private (Comment owner or Admin)
 */
router.put('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(komentarSchemas.update),
  updateKomentar
);

/**
 * @route   DELETE /api/komentar/:id
 * @desc    Delete comment
 * @access  Private (Comment owner or Admin)
 */
router.delete('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  deleteKomentar
);

/**
 * @route   POST /api/komentar/:id/report
 * @desc    Report comment
 * @access  Private (Authenticated users)
 */
router.post('/:id/report',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  reportKomentar
);

module.exports = router;
