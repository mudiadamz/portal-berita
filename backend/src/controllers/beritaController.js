/**
 * Berita Controller
 * Handles news management operations
 */

const Berita = require('../models/Berita');
const Kategori = require('../models/Kategori');
const KanalInstansi = require('../models/KanalInstansi');
const { sendSuccess, sendError, sendNotFound, sendForbidden, sendConflict } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all news articles
 * @route GET /api/berita
 * @access Public (but filtered by status for non-authenticated users)
 */
const getAllBerita = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = '',
    kategoriId = null,
    status = null,
    authorId = null,
    kanalInstansiId = null,
    isFeatured = null,
    isBreakingNews = null
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    kategoriId: kategoriId ? parseInt(kategoriId) : null,
    status: req.user?.role === 'admin' || req.user?.role === 'jurnalis' ? status : 'published',
    authorId: authorId ? parseInt(authorId) : null,
    kanalInstansiId: kanalInstansiId ? parseInt(kanalInstansiId) : null,
    isFeatured: isFeatured !== null ? isFeatured === 'true' : null,
    isBreakingNews: isBreakingNews !== null ? isBreakingNews === 'true' : null
  };

  const result = await Berita.findAll(options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'News articles retrieved successfully', {
    articles: result.articles.map(berita => berita.toJSON())
  }, meta);
});

/**
 * Get news article by ID
 * @route GET /api/berita/:id
 * @access Public (but filtered by status for non-authenticated users)
 */
const getBeritaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const berita = await Berita.findById(id);
  
  if (!berita) {
    return sendNotFound(res, 'News article not found');
  }

  // Check if user can view this article
  if (berita.status !== 'published' && 
      (!req.user || (req.user.role !== 'admin' && req.user.role !== 'jurnalis' && req.user.id !== berita.authorId))) {
    return sendNotFound(res, 'News article not found');
  }

  // Increment views count for published articles
  if (berita.status === 'published') {
    await Berita.incrementViews(id);
    berita.viewsCount += 1;
  }

  sendSuccess(res, 200, 'News article retrieved successfully', {
    article: berita.toJSON()
  });
});

/**
 * Get news article by slug
 * @route GET /api/berita/slug/:slug
 * @access Public (but filtered by status for non-authenticated users)
 */
const getBeritaBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const berita = await Berita.findBySlug(slug);
  
  if (!berita) {
    return sendNotFound(res, 'News article not found');
  }

  // Check if user can view this article
  if (berita.status !== 'published' && 
      (!req.user || (req.user.role !== 'admin' && req.user.role !== 'jurnalis' && req.user.id !== berita.authorId))) {
    return sendNotFound(res, 'News article not found');
  }

  // Increment views count for published articles
  if (berita.status === 'published') {
    await Berita.incrementViews(berita.id);
    berita.viewsCount += 1;
  }

  sendSuccess(res, 200, 'News article retrieved successfully', {
    article: berita.toJSON()
  });
});

/**
 * Create new news article
 * @route POST /api/berita
 * @access Private (Jurnalis, Admin, Instansi roles)
 */
const createBerita = asyncHandler(async (req, res) => {
  const {
    judul, slug, konten, ringkasan, gambarUtama, tags,
    kategoriId, kanalInstansiId, status, metaTitle, metaDescription,
    isFeatured, isBreakingNews
  } = req.body;

  // Check if slug already exists
  const existingBerita = await Berita.findBySlug(slug);
  if (existingBerita) {
    return sendConflict(res, 'News article with this slug already exists');
  }

  // Validate category exists
  const kategori = await Kategori.findById(kategoriId);
  if (!kategori) {
    return sendError(res, 400, 'Invalid category ID');
  }

  // Validate institution channel if provided
  if (kanalInstansiId) {
    const kanalInstansi = await KanalInstansi.findById(kanalInstansiId);
    if (!kanalInstansi) {
      return sendError(res, 400, 'Invalid institution channel ID');
    }

    // Check if user can use this channel
    if (req.user.role !== 'admin' && req.user.id !== kanalInstansi.userId) {
      return sendForbidden(res, 'You can only publish to your own institution channel');
    }
  }

  // Determine status based on user role
  let articleStatus = status || 'draft';
  if (req.user.role === 'pengguna') {
    articleStatus = 'draft'; // Regular users can only create drafts
  } else if (req.user.role === 'instansi' && articleStatus === 'published') {
    articleStatus = 'review'; // Institution articles need review before publishing
  }

  // Only admin and jurnalis can set featured and breaking news
  const canSetSpecialFlags = req.user.role === 'admin' || req.user.role === 'jurnalis';

  const beritaData = {
    judul, slug, konten, ringkasan, gambarUtama,
    tags: tags || [],
    kategoriId,
    kanalInstansiId,
    status: articleStatus,
    tanggalPublikasi: articleStatus === 'published' ? new Date() : null,
    authorId: req.user.id,
    metaTitle, metaDescription,
    isFeatured: canSetSpecialFlags ? (isFeatured || false) : false,
    isBreakingNews: canSetSpecialFlags ? (isBreakingNews || false) : false
  };

  const berita = await Berita.create(beritaData);

  logger.info(`News article created: ${judul} by user ${req.user.id}`);

  sendSuccess(res, 201, 'News article created successfully', {
    article: berita.toJSON()
  });
});

/**
 * Update news article
 * @route PUT /api/berita/:id
 * @access Private (Admin, Jurnalis, or Article Author)
 */
const updateBerita = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    judul, slug, konten, ringkasan, gambarUtama, tags,
    kategoriId, kanalInstansiId, status, metaTitle, metaDescription,
    isFeatured, isBreakingNews
  } = req.body;

  // Check if article exists
  const existingBerita = await Berita.findById(id);
  if (!existingBerita) {
    return sendNotFound(res, 'News article not found');
  }

  // Check permissions
  const canEdit = req.user.role === 'admin' || 
                  req.user.role === 'jurnalis' || 
                  req.user.id === existingBerita.authorId;

  if (!canEdit) {
    return sendForbidden(res, 'You can only edit your own articles');
  }

  // Check if slug is being changed and if it already exists
  if (slug && slug !== existingBerita.slug) {
    const slugExists = await Berita.slugExists(slug, id);
    if (slugExists) {
      return sendConflict(res, 'Slug already in use');
    }
  }

  // Validate category if being changed
  if (kategoriId && kategoriId !== existingBerita.kategoriId) {
    const kategori = await Kategori.findById(kategoriId);
    if (!kategori) {
      return sendError(res, 400, 'Invalid category ID');
    }
  }

  // Validate institution channel if being changed
  if (kanalInstansiId && kanalInstansiId !== existingBerita.kanalInstansiId) {
    const kanalInstansi = await KanalInstansi.findById(kanalInstansiId);
    if (!kanalInstansi) {
      return sendError(res, 400, 'Invalid institution channel ID');
    }

    // Check if user can use this channel
    if (req.user.role !== 'admin' && req.user.id !== kanalInstansi.userId) {
      return sendForbidden(res, 'You can only publish to your own institution channel');
    }
  }

  // Prepare update data
  const updateData = {};
  if (judul !== undefined) updateData.judul = judul;
  if (slug !== undefined) updateData.slug = slug;
  if (konten !== undefined) updateData.konten = konten;
  if (ringkasan !== undefined) updateData.ringkasan = ringkasan;
  if (gambarUtama !== undefined) updateData.gambarUtama = gambarUtama;
  if (tags !== undefined) updateData.tags = tags;
  if (kategoriId !== undefined) updateData.kategoriId = kategoriId;
  if (kanalInstansiId !== undefined) updateData.kanalInstansiId = kanalInstansiId;
  if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
  if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

  // Handle status updates based on user role
  if (status !== undefined) {
    if (req.user.role === 'admin' || req.user.role === 'jurnalis') {
      updateData.status = status;
      if (status === 'published' && existingBerita.status !== 'published') {
        updateData.tanggalPublikasi = new Date();
      }
    } else if (req.user.role === 'instansi' && status === 'review') {
      updateData.status = status;
    } else if (req.user.role === 'pengguna' && status === 'draft') {
      updateData.status = status;
    }
  }

  // Only admin and jurnalis can set featured and breaking news
  const canSetSpecialFlags = req.user.role === 'admin' || req.user.role === 'jurnalis';
  if (canSetSpecialFlags) {
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isBreakingNews !== undefined) updateData.isBreakingNews = isBreakingNews;
  }

  // Update article
  const updatedBerita = await Berita.update(id, updateData);

  logger.info(`News article updated: ${updatedBerita.judul} by user ${req.user.id}`);

  sendSuccess(res, 200, 'News article updated successfully', {
    article: updatedBerita.toJSON()
  });
});

/**
 * Update news article status
 * @route PUT /api/berita/:id/status
 * @access Private (Admin, Jurnalis for workflow management)
 */
const updateBeritaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Check if article exists
  const existingBerita = await Berita.findById(id);
  if (!existingBerita) {
    return sendNotFound(res, 'News article not found');
  }

  // Check permissions for status changes
  const canChangeStatus = req.user.role === 'admin' || req.user.role === 'jurnalis';
  if (!canChangeStatus) {
    return sendForbidden(res, 'You do not have permission to change article status');
  }

  const updateData = { status };
  if (status === 'published' && existingBerita.status !== 'published') {
    updateData.tanggalPublikasi = new Date();
  }

  // Update article status
  const updatedBerita = await Berita.update(id, updateData);

  logger.info(`News article status updated: ${updatedBerita.judul} to ${status} by user ${req.user.id}`);

  sendSuccess(res, 200, 'News article status updated successfully', {
    article: updatedBerita.toJSON()
  });
});

/**
 * Delete news article
 * @route DELETE /api/berita/:id
 * @access Private (Admin, Jurnalis, or Article Author)
 */
const deleteBerita = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if article exists
  const existingBerita = await Berita.findById(id);
  if (!existingBerita) {
    return sendNotFound(res, 'News article not found');
  }

  // Check permissions
  const canDelete = req.user.role === 'admin' ||
                    req.user.role === 'jurnalis' ||
                    req.user.id === existingBerita.authorId;

  if (!canDelete) {
    return sendForbidden(res, 'You can only delete your own articles');
  }

  // Delete article
  const success = await Berita.delete(id);

  if (!success) {
    return sendError(res, 500, 'Failed to delete news article');
  }

  logger.info(`News article deleted: ${existingBerita.judul} by user ${req.user.id}`);

  sendSuccess(res, 200, 'News article deleted successfully');
});

/**
 * Get current user's articles
 * @route GET /api/berita/my-articles
 * @access Private
 */
const getMyBerita = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = '',
    kategoriId = null,
    status = ''
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    kategoriId: kategoriId ? parseInt(kategoriId) : null,
    status,
    authorId: req.user.id
  };

  const result = await Berita.findAll(options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Your articles retrieved successfully', {
    articles: result.articles.map(berita => berita.toJSON())
  }, meta);
});

/**
 * Get news statistics
 * @route GET /api/berita/stats
 * @access Private (Admin, Jurnalis)
 */
const getBeritaStats = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');

  let statsQuery = `
    SELECT
      COUNT(*) as total_articles,
      COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles,
      COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_articles,
      COUNT(CASE WHEN status = 'review' THEN 1 END) as review_articles,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_articles,
      COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_articles,
      COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_articles,
      COUNT(CASE WHEN is_breaking_news = 1 THEN 1 END) as breaking_news_articles,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as articles_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as articles_this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as articles_this_month,
      AVG(views_count) as avg_views,
      MAX(views_count) as max_views
    FROM berita
  `;

  // If user is not admin, only show their own stats
  if (req.user.role !== 'admin') {
    statsQuery += ` WHERE author_id = ${req.user.id}`;
  }

  const stats = await db.query(statsQuery);

  sendSuccess(res, 200, 'News statistics retrieved successfully', {
    stats: stats[0]
  });
});

module.exports = {
  getAllBerita,
  getBeritaById,
  getBeritaBySlug,
  createBerita,
  updateBerita,
  updateBeritaStatus,
  deleteBerita,
  getMyBerita,
  getBeritaStats
};
