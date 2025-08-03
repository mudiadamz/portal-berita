/**
 * KanalInstansi Routes
 * Routes for institution channel management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllKanalInstansi,
  getKanalInstansiById,
  getKanalInstansiBySlug,
  createKanalInstansi,
  updateKanalInstansi,
  deleteKanalInstansi,
  getMyKanalInstansi,
  getVerifiedKanalInstansi,
  getKanalInstansiStats
} = require('../controllers/kanalInstansiController');

// Import middleware
const { authenticate, adminOnly, instansiOnly, canManageChannel } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { kanalInstansiSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Channel ID must be a number',
    'number.integer': 'Channel ID must be an integer',
    'number.positive': 'Channel ID must be positive',
    'any.required': 'Channel ID is required'
  })
});

const slugParamSchema = Joi.object({
  slug: Joi.string().min(2).max(170).pattern(/^[a-z0-9-]+$/).required().messages({
    'string.min': 'Slug must be at least 2 characters long',
    'string.max': 'Slug cannot exceed 170 characters',
    'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    'any.required': 'Slug is required'
  })
});

// Extended query schema for channels
const kanalInstansiQuerySchema = querySchemas.pagination.keys({
  search: Joi.string().min(1).max(100).messages({
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  isVerified: Joi.string().valid('true', 'false'),
  isActive: Joi.string().valid('true', 'false')
});

/**
 * @route   GET /api/kanal-instansi/stats
 * @desc    Get institution channel statistics
 * @access  Private (Admin only)
 */
router.get('/stats',
  authenticate,
  adminOnly,
  readLimiter,
  getKanalInstansiStats
);

/**
 * @route   GET /api/kanal-instansi/verified
 * @desc    Get verified channels only
 * @access  Public
 */
router.get('/verified',
  readLimiter,
  getVerifiedKanalInstansi
);

/**
 * @route   GET /api/kanal-instansi/my-channels
 * @desc    Get current user's channels
 * @access  Private (Instansi role)
 */
router.get('/my-channels',
  authenticate,
  instansiOnly,
  readLimiter,
  validateQuery(kanalInstansiQuerySchema),
  getMyKanalInstansi
);

/**
 * @route   GET /api/kanal-instansi/slug/:slug
 * @desc    Get channel by slug
 * @access  Public
 */
router.get('/slug/:slug',
  readLimiter,
  validateParams(slugParamSchema),
  getKanalInstansiBySlug
);

/**
 * @route   GET /api/kanal-instansi
 * @desc    Get all channels with pagination and filtering
 * @access  Public
 */
router.get('/',
  readLimiter,
  validateQuery(kanalInstansiQuerySchema),
  getAllKanalInstansi
);

/**
 * @route   GET /api/kanal-instansi/:id
 * @desc    Get channel by ID
 * @access  Public
 */
router.get('/:id',
  readLimiter,
  validateParams(idParamSchema),
  getKanalInstansiById
);

/**
 * @route   POST /api/kanal-instansi
 * @desc    Create new channel
 * @access  Private (Instansi role only)
 */
router.post('/',
  authenticate,
  instansiOnly,
  writeLimiter,
  validateBody(kanalInstansiSchemas.create),
  createKanalInstansi
);

/**
 * @route   PUT /api/kanal-instansi/:id
 * @desc    Update channel
 * @access  Private (Channel owner or Admin)
 */
router.put('/:id',
  authenticate,
  canManageChannel,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(kanalInstansiSchemas.update),
  updateKanalInstansi
);

/**
 * @route   DELETE /api/kanal-instansi/:id
 * @desc    Delete channel
 * @access  Private (Channel owner or Admin)
 */
router.delete('/:id',
  authenticate,
  canManageChannel,
  writeLimiter,
  validateParams(idParamSchema),
  deleteKanalInstansi
);

module.exports = router;
