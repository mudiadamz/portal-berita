/**
 * Post Controller
 * Handles post management operations
 */

const Post = require('../models/Post');
const { sendSuccess, sendError, sendNotFound, sendForbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all posts
 * @route GET /api/posts
 * @access Public
 */
const getAllPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = '',
    category = '',
    status = '',
    author = ''
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    category,
    status: req.user?.role === 'admin' || req.user?.role === 'editor' ? status : 'published',
    authorId: author ? parseInt(author) : null
  };

  const result = await Post.findAll(options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Posts retrieved successfully', {
    posts: result.posts.map(post => post.toJSON())
  }, meta);
});

/**
 * Get post by ID
 * @route GET /api/posts/:id
 * @access Public
 */
const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);
  
  if (!post) {
    return sendNotFound(res, 'Post not found');
  }

  // Check if user can view this post
  if (post.status !== 'published' && 
      (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor' && req.user.id !== post.authorId))) {
    return sendNotFound(res, 'Post not found');
  }

  sendSuccess(res, 200, 'Post retrieved successfully', {
    post: post.toJSON()
  });
});

/**
 * Create new post
 * @route POST /api/posts
 * @access Private (Admin, Editor, User)
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category, tags, status } = req.body;

  // Users can only create drafts, editors and admins can publish
  let postStatus = status || 'draft';
  if (req.user.role === 'user' && postStatus !== 'draft') {
    postStatus = 'draft';
  }

  const postData = {
    title,
    content,
    excerpt,
    category,
    tags: tags || [],
    status: postStatus,
    authorId: req.user.id
  };

  const post = await Post.create(postData);

  logger.info(`Post created: ${title} by user ${req.user.id}`);

  sendSuccess(res, 201, 'Post created successfully', {
    post: post.toJSON()
  });
});

/**
 * Update post
 * @route PUT /api/posts/:id
 * @access Private (Admin, Editor, or Post Author)
 */
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, category, tags, status } = req.body;

  // Check if post exists
  const existingPost = await Post.findById(id);
  if (!existingPost) {
    return sendNotFound(res, 'Post not found');
  }

  // Check permissions
  const canEdit = req.user.role === 'admin' || 
                  req.user.role === 'editor' || 
                  req.user.id === existingPost.authorId;

  if (!canEdit) {
    return sendForbidden(res, 'You can only edit your own posts');
  }

  // Prepare update data
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) updateData.tags = tags;
  
  // Handle status updates based on user role
  if (status !== undefined) {
    if (req.user.role === 'admin' || req.user.role === 'editor') {
      updateData.status = status;
    } else if (req.user.role === 'user' && status === 'draft') {
      updateData.status = status;
    }
    // Users cannot publish directly, only save as draft
  }

  // Update post
  const updatedPost = await Post.update(id, updateData);

  logger.info(`Post updated: ${updatedPost.title} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Post updated successfully', {
    post: updatedPost.toJSON()
  });
});

/**
 * Delete post
 * @route DELETE /api/posts/:id
 * @access Private (Admin, Editor, or Post Author)
 */
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if post exists
  const existingPost = await Post.findById(id);
  if (!existingPost) {
    return sendNotFound(res, 'Post not found');
  }

  // Check permissions
  const canDelete = req.user.role === 'admin' || 
                    req.user.role === 'editor' || 
                    req.user.id === existingPost.authorId;

  if (!canDelete) {
    return sendForbidden(res, 'You can only delete your own posts');
  }

  // Delete post
  const success = await Post.delete(id);
  
  if (!success) {
    return sendError(res, 500, 'Failed to delete post');
  }

  logger.info(`Post deleted: ${existingPost.title} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Post deleted successfully');
});

/**
 * Get posts by current user
 * @route GET /api/posts/my-posts
 * @access Private
 */
const getMyPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = '',
    category = '',
    status = ''
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    category,
    status,
    authorId: req.user.id
  };

  const result = await Post.findByAuthor(req.user.id, options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Your posts retrieved successfully', {
    posts: result.posts.map(post => post.toJSON())
  }, meta);
});

/**
 * Get post categories
 * @route GET /api/posts/categories
 * @access Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Post.getCategories();

  sendSuccess(res, 200, 'Categories retrieved successfully', {
    categories
  });
});

/**
 * Get post statistics
 * @route GET /api/posts/stats
 * @access Private (Admin, Editor)
 */
const getPostStats = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');
  
  let statsQuery = `
    SELECT 
      COUNT(*) as total_posts,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts,
      COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_posts,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as posts_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as posts_this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as posts_this_month
    FROM posts
  `;

  // If user is not admin, only show their own stats
  if (req.user.role !== 'admin') {
    statsQuery += ` WHERE author_id = ${req.user.id}`;
  }
  
  const stats = await db.query(statsQuery);

  sendSuccess(res, 200, 'Post statistics retrieved successfully', {
    stats: stats[0]
  });
});

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getMyPosts,
  getCategories,
  getPostStats
};
