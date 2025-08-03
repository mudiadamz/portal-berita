/**
 * Berita Komentar Routes
 * Routes for comments on news articles
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getKomentarByBerita,
  createKomentar
} = require('../controllers/komentarController');

// Import middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { komentarSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
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
 * @route   GET /api/berita/:beritaId/komentar
 * @desc    Get comments for a news article
 * @access  Public
 */
router.get('/:beritaId/komentar',
  optionalAuth,
  readLimiter,
  validateParams(beritaIdParamSchema),
  validateQuery(komentarQuerySchema),
  getKomentarByBerita
);

/**
 * @route   POST /api/berita/:beritaId/komentar
 * @desc    Add comment to a news article
 * @access  Private (Authenticated users)
 */
router.post('/:beritaId/komentar',
  authenticate,
  writeLimiter,
  validateParams(beritaIdParamSchema),
  validateBody(komentarSchemas.create),
  createKomentar
);

module.exports = router;
