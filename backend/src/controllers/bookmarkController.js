/**
 * Bookmark Controller
 * Handles bookmark management operations
 */

const Bookmark = require('../models/Bookmark');
const Berita = require('../models/Berita');
const { sendSuccess, sendError, sendNotFound, sendConflict } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get user's bookmarks
 * @route GET /api/bookmarks
 * @access Private (Authenticated users)
 */
const getBookmarks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    kategoriId = null,
    search = ''
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    kategoriId: kategoriId ? parseInt(kategoriId) : null,
    search
  };

  const result = await Bookmark.findByUser(req.user.id, options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Bookmarks retrieved successfully', {
    bookmarks: result.bookmarks.map(bookmark => bookmark.toJSON())
  }, meta);
});

/**
 * Get bookmark by ID
 * @route GET /api/bookmarks/:id
 * @access Private (Bookmark owner only)
 */
const getBookmarkById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bookmark = await Bookmark.findById(id);
  
  if (!bookmark) {
    return sendNotFound(res, 'Bookmark not found');
  }

  // Check if user owns this bookmark
  if (bookmark.userId !== req.user.id) {
    return sendNotFound(res, 'Bookmark not found');
  }

  sendSuccess(res, 200, 'Bookmark retrieved successfully', {
    bookmark: bookmark.toJSON()
  });
});

/**
 * Add bookmark
 * @route POST /api/bookmarks
 * @access Private (Authenticated users)
 */
const createBookmark = asyncHandler(async (req, res) => {
  const { beritaId } = req.body;

  // Check if news article exists and is published
  const berita = await Berita.findById(beritaId);
  if (!berita) {
    return sendNotFound(res, 'News article not found');
  }

  if (berita.status !== 'published') {
    return sendError(res, 400, 'Cannot bookmark unpublished articles');
  }

  // Check if bookmark already exists
  const existingBookmark = await Bookmark.findByUserAndBerita(req.user.id, beritaId);
  if (existingBookmark) {
    return sendConflict(res, 'Article already bookmarked');
  }

  // Create bookmark
  const bookmarkData = {
    userId: req.user.id,
    beritaId: parseInt(beritaId)
  };

  const bookmark = await Bookmark.create(bookmarkData);

  logger.info(`Bookmark created: User ${req.user.id} bookmarked article ${beritaId}`);

  sendSuccess(res, 201, 'Bookmark added successfully', {
    bookmark: bookmark.toJSON()
  });
});

/**
 * Remove bookmark
 * @route DELETE /api/bookmarks/:id
 * @access Private (Bookmark owner only)
 */
const deleteBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if bookmark exists
  const existingBookmark = await Bookmark.findById(id);
  if (!existingBookmark) {
    return sendNotFound(res, 'Bookmark not found');
  }

  // Check if user owns this bookmark
  if (existingBookmark.userId !== req.user.id) {
    return sendNotFound(res, 'Bookmark not found');
  }

  // Delete bookmark
  const success = await Bookmark.delete(id);
  
  if (!success) {
    return sendError(res, 500, 'Failed to remove bookmark');
  }

  logger.info(`Bookmark deleted: ID ${id} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Bookmark removed successfully');
});

/**
 * Remove bookmark by article ID
 * @route DELETE /api/bookmarks/article/:beritaId
 * @access Private (Authenticated users)
 */
const deleteBookmarkByArticle = asyncHandler(async (req, res) => {
  const { beritaId } = req.params;

  // Check if bookmark exists
  const existingBookmark = await Bookmark.findByUserAndBerita(req.user.id, parseInt(beritaId));
  if (!existingBookmark) {
    return sendNotFound(res, 'Bookmark not found');
  }

  // Delete bookmark
  const success = await Bookmark.deleteByUserAndBerita(req.user.id, parseInt(beritaId));
  
  if (!success) {
    return sendError(res, 500, 'Failed to remove bookmark');
  }

  logger.info(`Bookmark deleted: User ${req.user.id}, Article ${beritaId}`);

  sendSuccess(res, 200, 'Bookmark removed successfully');
});

/**
 * Check if article is bookmarked
 * @route GET /api/bookmarks/check/:beritaId
 * @access Private (Authenticated users)
 */
const checkBookmark = asyncHandler(async (req, res) => {
  const { beritaId } = req.params;

  const isBookmarked = await Bookmark.exists(req.user.id, parseInt(beritaId));

  sendSuccess(res, 200, 'Bookmark status retrieved successfully', {
    isBookmarked,
    beritaId: parseInt(beritaId),
    userId: req.user.id
  });
});

/**
 * Get bookmark statistics for current user
 * @route GET /api/bookmarks/stats
 * @access Private (Authenticated users)
 */
const getBookmarkStats = asyncHandler(async (req, res) => {
  const stats = await Bookmark.getStatsByUser(req.user.id);

  sendSuccess(res, 200, 'Bookmark statistics retrieved successfully', {
    stats
  });
});

/**
 * Get bookmarked articles by category
 * @route GET /api/bookmarks/by-category
 * @access Private (Authenticated users)
 */
const getBookmarksByCategory = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');
  
  // Get bookmarks grouped by category
  const query = `
    SELECT k.nama as kategori_nama, k.slug as kategori_slug, COUNT(bm.id) as bookmark_count
    FROM bookmark bm
    INNER JOIN berita b ON bm.berita_id = b.id
    INNER JOIN kategori k ON b.kategori_id = k.id
    WHERE bm.user_id = ? AND b.status = 'published'
    GROUP BY k.id, k.nama, k.slug
    ORDER BY bookmark_count DESC
  `;
  
  const categories = await db.query(query, [req.user.id]);

  sendSuccess(res, 200, 'Bookmarks by category retrieved successfully', {
    categories
  });
});

/**
 * Get recently bookmarked articles
 * @route GET /api/bookmarks/recent
 * @access Private (Authenticated users)
 */
const getRecentBookmarks = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const options = {
    page: 1,
    limit: parseInt(limit),
    sort: 'created_at',
    order: 'desc'
  };

  const result = await Bookmark.findByUser(req.user.id, options);

  sendSuccess(res, 200, 'Recent bookmarks retrieved successfully', {
    bookmarks: result.bookmarks.map(bookmark => bookmark.toJSON())
  });
});

/**
 * Bulk remove bookmarks
 * @route DELETE /api/bookmarks/bulk
 * @access Private (Authenticated users)
 */
const bulkDeleteBookmarks = asyncHandler(async (req, res) => {
  const { bookmarkIds } = req.body;

  if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
    return sendError(res, 400, 'Bookmark IDs array is required');
  }

  const db = require('../../config/database-connection');
  
  // Verify all bookmarks belong to the user
  const verifyQuery = `
    SELECT id FROM bookmark 
    WHERE id IN (${bookmarkIds.map(() => '?').join(',')}) AND user_id = ?
  `;
  
  const verifyParams = [...bookmarkIds, req.user.id];
  const ownedBookmarks = await db.query(verifyQuery, verifyParams);

  if (ownedBookmarks.length !== bookmarkIds.length) {
    return sendError(res, 403, 'You can only delete your own bookmarks');
  }

  // Delete bookmarks
  const deleteQuery = `
    DELETE FROM bookmark 
    WHERE id IN (${bookmarkIds.map(() => '?').join(',')}) AND user_id = ?
  `;
  
  const deleteParams = [...bookmarkIds, req.user.id];
  const result = await db.query(deleteQuery, deleteParams);

  logger.info(`Bulk bookmark deletion: ${result.affectedRows} bookmarks deleted by user ${req.user.id}`);

  sendSuccess(res, 200, `${result.affectedRows} bookmarks removed successfully`, {
    deletedCount: result.affectedRows
  });
});

module.exports = {
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
};
