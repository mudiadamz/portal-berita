/**
 * Komentar Controller
 * Handles comment management operations
 */

const Komentar = require('../models/Komentar');
const Berita = require('../models/Berita');
const { sendSuccess, sendError, sendNotFound, sendForbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get comments for a news article
 * @route GET /api/berita/:beritaId/komentar
 * @access Public
 */
const getKomentarByBerita = asyncHandler(async (req, res) => {
  const { beritaId } = req.params;
  const {
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'asc'
  } = req.query;

  // Check if news article exists and is published
  const berita = await Berita.findById(beritaId);
  if (!berita) {
    return sendNotFound(res, 'News article not found');
  }

  if (berita.status !== 'published' && 
      (!req.user || (req.user.role !== 'admin' && req.user.role !== 'jurnalis' && req.user.id !== berita.authorId))) {
    return sendNotFound(res, 'News article not found');
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    isApproved: req.user?.role === 'admin' ? null : true // Admin can see all comments
  };

  const result = await Komentar.findByBerita(beritaId, options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Comments retrieved successfully', {
    comments: result.comments.map(komentar => komentar.toJSON())
  }, meta);
});

/**
 * Add comment to a news article
 * @route POST /api/berita/:beritaId/komentar
 * @access Private (Authenticated users)
 */
const createKomentar = asyncHandler(async (req, res) => {
  const { beritaId } = req.params;
  const { konten, parentId } = req.body;

  // Check if news article exists and is published
  const berita = await Berita.findById(beritaId);
  if (!berita) {
    return sendNotFound(res, 'News article not found');
  }

  if (berita.status !== 'published') {
    return sendError(res, 400, 'Cannot comment on unpublished articles');
  }

  // Check if parent comment exists (for replies)
  if (parentId) {
    const parentComment = await Komentar.findById(parentId);
    if (!parentComment || parentComment.beritaId !== parseInt(beritaId)) {
      return sendError(res, 400, 'Invalid parent comment');
    }
  }

  // Create comment
  const komentarData = {
    konten,
    beritaId: parseInt(beritaId),
    userId: req.user.id,
    parentId: parentId || null,
    isApproved: true // Auto-approve for now, can be changed to require moderation
  };

  const komentar = await Komentar.create(komentarData);

  logger.info(`Comment created on article ${beritaId} by user ${req.user.id}`);

  sendSuccess(res, 201, 'Comment added successfully', {
    comment: komentar.toJSON()
  });
});

/**
 * Update comment
 * @route PUT /api/komentar/:id
 * @access Private (Comment owner or Admin)
 */
const updateKomentar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { konten, isApproved, isReported } = req.body;

  // Check if comment exists
  const existingKomentar = await Komentar.findById(id);
  if (!existingKomentar) {
    return sendNotFound(res, 'Comment not found');
  }

  // Check permissions
  const canEdit = req.user.role === 'admin' || req.user.id === existingKomentar.userId;
  if (!canEdit) {
    return sendForbidden(res, 'You can only edit your own comments');
  }

  // Prepare update data
  const updateData = {};
  
  // Regular users can only edit content
  if (req.user.id === existingKomentar.userId) {
    if (konten !== undefined) updateData.konten = konten;
  }

  // Admin can update all fields
  if (req.user.role === 'admin') {
    if (konten !== undefined) updateData.konten = konten;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (isReported !== undefined) updateData.isReported = isReported;
  }

  if (Object.keys(updateData).length === 0) {
    return sendError(res, 400, 'No valid fields to update');
  }

  // Update comment
  const updatedKomentar = await Komentar.update(id, updateData);

  logger.info(`Comment updated: ID ${id} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Comment updated successfully', {
    comment: updatedKomentar.toJSON()
  });
});

/**
 * Delete comment
 * @route DELETE /api/komentar/:id
 * @access Private (Comment owner or Admin)
 */
const deleteKomentar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if comment exists
  const existingKomentar = await Komentar.findById(id);
  if (!existingKomentar) {
    return sendNotFound(res, 'Comment not found');
  }

  // Check permissions
  const canDelete = req.user.role === 'admin' || req.user.id === existingKomentar.userId;
  if (!canDelete) {
    return sendForbidden(res, 'You can only delete your own comments');
  }

  // Delete comment (this will also delete replies due to CASCADE)
  const success = await Komentar.delete(id);
  
  if (!success) {
    return sendError(res, 500, 'Failed to delete comment');
  }

  logger.info(`Comment deleted: ID ${id} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Comment deleted successfully');
});

/**
 * Get current user's comments
 * @route GET /api/komentar/my-comments
 * @access Private
 */
const getMyKomentar = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc'
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order
  };

  const result = await Komentar.findByUser(req.user.id, options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Your comments retrieved successfully', {
    comments: result.comments.map(komentar => komentar.toJSON())
  }, meta);
});

/**
 * Get comment by ID
 * @route GET /api/komentar/:id
 * @access Public (for approved comments) / Private (for own comments or admin)
 */
const getKomentarById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const komentar = await Komentar.findById(id);
  
  if (!komentar) {
    return sendNotFound(res, 'Comment not found');
  }

  // Check if user can view this comment
  if (!komentar.isApproved && 
      (!req.user || (req.user.role !== 'admin' && req.user.id !== komentar.userId))) {
    return sendNotFound(res, 'Comment not found');
  }

  sendSuccess(res, 200, 'Comment retrieved successfully', {
    comment: komentar.toJSON()
  });
});

/**
 * Report comment
 * @route POST /api/komentar/:id/report
 * @access Private (Authenticated users)
 */
const reportKomentar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if comment exists
  const existingKomentar = await Komentar.findById(id);
  if (!existingKomentar) {
    return sendNotFound(res, 'Comment not found');
  }

  // Users cannot report their own comments
  if (req.user.id === existingKomentar.userId) {
    return sendError(res, 400, 'You cannot report your own comment');
  }

  // Update comment as reported
  const updatedKomentar = await Komentar.update(id, { isReported: true });

  logger.info(`Comment reported: ID ${id} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Comment reported successfully', {
    comment: updatedKomentar.toJSON()
  });
});

/**
 * Get comment statistics
 * @route GET /api/komentar/stats
 * @access Private (Admin only)
 */
const getKomentarStats = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');
  
  // Get comment statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as total_comments,
      COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved_comments,
      COUNT(CASE WHEN is_approved = 0 THEN 1 END) as pending_comments,
      COUNT(CASE WHEN is_reported = 1 THEN 1 END) as reported_comments,
      COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as top_level_comments,
      COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as reply_comments,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as comments_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as comments_this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as comments_this_month
    FROM komentar
  `;
  
  const stats = await db.query(statsQuery);

  // Get most active commenters
  const activeUsersQuery = `
    SELECT u.name, u.email, COUNT(k.id) as comment_count
    FROM users u
    INNER JOIN komentar k ON u.id = k.user_id
    WHERE k.is_approved = 1
    GROUP BY u.id, u.name, u.email
    ORDER BY comment_count DESC
    LIMIT 10
  `;
  
  const activeUsers = await db.query(activeUsersQuery);

  sendSuccess(res, 200, 'Comment statistics retrieved successfully', {
    stats: stats[0],
    activeCommenters: activeUsers
  });
});

module.exports = {
  getKomentarByBerita,
  createKomentar,
  updateKomentar,
  deleteKomentar,
  getMyKomentar,
  getKomentarById,
  reportKomentar,
  getKomentarStats
};
