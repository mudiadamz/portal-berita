/**
 * Post Routes
 * Routes for post management
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
  getCategories,
  getPostStats
} = require('../controllers/postController');

// Import middleware
const { authenticate, optionalAuth, adminOrJurnalis } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const { readLimiter, writeLimiter } = require('../middleware/rateLimiter');
const { postSchemas, querySchemas } = require('../utils/validation');

// Import validation schemas
const Joi = require('joi');

// Parameter validation schemas
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Post ID must be a number',
    'number.integer': 'Post ID must be an integer',
    'number.positive': 'Post ID must be positive',
    'any.required': 'Post ID is required'
  })
});

// Extended query schema for posts
const postQuerySchema = querySchemas.pagination.keys({
  search: Joi.string().min(1).max(100).messages({
    'string.min': 'Search query must be at least 1 character long',
    'string.max': 'Search query cannot exceed 100 characters'
  }),
  category: Joi.string().min(2).max(50),
  status: Joi.string().valid('draft', 'published', 'archived'),
  author: Joi.number().integer().positive()
});

/**
 * @route   GET /api/posts/categories
 * @desc    Get all post categories
 * @access  Public
 */
router.get('/categories',
  readLimiter,
  getCategories
);

/**
 * @route   GET /api/posts/stats
 * @desc    Get post statistics
 * @access  Private (Admin, Editor)
 */
router.get('/stats',
  authenticate,
  adminOrJurnalis,
  readLimiter,
  getPostStats
);

/**
 * @route   GET /api/posts/my-posts
 * @desc    Get current user's posts
 * @access  Private
 */
router.get('/my-posts',
  authenticate,
  readLimiter,
  validateQuery(postQuerySchema),
  getMyPosts
);

/**
 * @route   GET /api/posts
 * @desc    Get all posts with pagination and filtering
 * @access  Public (but shows only published posts for non-authenticated users)
 */
router.get('/',
  optionalAuth,
  readLimiter,
  validateQuery(postQuerySchema),
  getAllPosts
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get post by ID
 * @access  Public (but shows only published posts for non-authenticated users)
 */
router.get('/:id',
  optionalAuth,
  readLimiter,
  validateParams(idParamSchema),
  getPostById
);

/**
 * @route   POST /api/posts
 * @desc    Create new post
 * @access  Private (All authenticated users)
 */
router.post('/',
  authenticate,
  writeLimiter,
  validateBody(postSchemas.create),
  createPost
);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update post
 * @access  Private (Admin, Editor, or Post Author)
 */
router.put('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  validateBody(postSchemas.update),
  updatePost
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post
 * @access  Private (Admin, Editor, or Post Author)
 */
router.delete('/:id',
  authenticate,
  writeLimiter,
  validateParams(idParamSchema),
  deletePost
);

module.exports = router;
