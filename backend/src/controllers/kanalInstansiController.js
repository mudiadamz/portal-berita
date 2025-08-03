/**
 * KanalInstansi Controller
 * Handles institution channel management operations
 */

const KanalInstansi = require('../models/KanalInstansi');
const { sendSuccess, sendError, sendNotFound, sendConflict, sendForbidden } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { createPaginationMeta } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get all institution channels
 * @route GET /api/kanal-instansi
 * @access Public
 */
const getAllKanalInstansi = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = '',
    isVerified = null,
    isActive = null
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    isVerified: isVerified !== null ? isVerified === 'true' : null,
    isActive: isActive !== null ? isActive === 'true' : null
  };

  const result = await KanalInstansi.findAll(options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Institution channels retrieved successfully', {
    channels: result.channels.map(kanal => kanal.toJSON())
  }, meta);
});

/**
 * Get channel by ID
 * @route GET /api/kanal-instansi/:id
 * @access Public
 */
const getKanalInstansiById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const kanal = await KanalInstansi.findById(id);
  
  if (!kanal) {
    return sendNotFound(res, 'Institution channel not found');
  }

  sendSuccess(res, 200, 'Institution channel retrieved successfully', {
    channel: kanal.toJSON()
  });
});

/**
 * Get channel by slug
 * @route GET /api/kanal-instansi/slug/:slug
 * @access Public
 */
const getKanalInstansiBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const kanal = await KanalInstansi.findBySlug(slug);
  
  if (!kanal) {
    return sendNotFound(res, 'Institution channel not found');
  }

  sendSuccess(res, 200, 'Institution channel retrieved successfully', {
    channel: kanal.toJSON()
  });
});

/**
 * Create new institution channel
 * @route POST /api/kanal-instansi
 * @access Private (Instansi role only)
 */
const createKanalInstansi = asyncHandler(async (req, res) => {
  const {
    nama, deskripsi, slug, logoUrl, websiteUrl,
    contactEmail, contactPhone, alamat
  } = req.body;

  // Check if slug already exists
  const existingKanal = await KanalInstansi.findBySlug(slug);
  if (existingKanal) {
    return sendConflict(res, 'Institution channel with this slug already exists');
  }

  // Create new channel
  const kanalData = {
    nama, deskripsi, slug, logoUrl, websiteUrl,
    contactEmail, contactPhone, alamat,
    userId: req.user.id,
    isVerified: false, // New channels need verification
    isActive: true
  };
  
  const kanal = await KanalInstansi.create(kanalData);

  logger.info(`Institution channel created: ${nama} by user ${req.user.id}`);

  sendSuccess(res, 201, 'Institution channel created successfully', {
    channel: kanal.toJSON()
  });
});

/**
 * Update institution channel
 * @route PUT /api/kanal-instansi/:id
 * @access Private (Channel owner or Admin)
 */
const updateKanalInstansi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nama, deskripsi, slug, logoUrl, websiteUrl,
    contactEmail, contactPhone, alamat, isVerified, isActive
  } = req.body;

  // Check if channel exists
  const existingKanal = await KanalInstansi.findById(id);
  if (!existingKanal) {
    return sendNotFound(res, 'Institution channel not found');
  }

  // Check permissions
  const canUpdate = req.user.role === 'admin' || req.user.id === existingKanal.userId;
  if (!canUpdate) {
    return sendForbidden(res, 'You can only update your own institution channel');
  }

  // Check if slug is being changed and if it already exists
  if (slug && slug !== existingKanal.slug) {
    const slugExists = await KanalInstansi.slugExists(slug, id);
    if (slugExists) {
      return sendConflict(res, 'Slug already in use');
    }
  }

  // Prepare update data
  const updateData = {};
  if (nama !== undefined) updateData.nama = nama;
  if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
  if (slug !== undefined) updateData.slug = slug;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
  if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
  if (alamat !== undefined) updateData.alamat = alamat;

  // Only admin can update verification and active status
  if (req.user.role === 'admin') {
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isActive !== undefined) updateData.isActive = isActive;
  }

  // Update channel
  const updatedKanal = await KanalInstansi.update(id, updateData);

  logger.info(`Institution channel updated: ${updatedKanal.nama} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Institution channel updated successfully', {
    channel: updatedKanal.toJSON()
  });
});

/**
 * Delete institution channel
 * @route DELETE /api/kanal-instansi/:id
 * @access Private (Channel owner or Admin)
 */
const deleteKanalInstansi = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if channel exists
  const existingKanal = await KanalInstansi.findById(id);
  if (!existingKanal) {
    return sendNotFound(res, 'Institution channel not found');
  }

  // Check permissions
  const canDelete = req.user.role === 'admin' || req.user.id === existingKanal.userId;
  if (!canDelete) {
    return sendForbidden(res, 'You can only delete your own institution channel');
  }

  // Check if channel is being used by any news articles
  const db = require('../../config/database-connection');
  const newsCount = await db.query('SELECT COUNT(*) as count FROM berita WHERE kanal_instansi_id = ?', [id]);
  
  if (newsCount[0].count > 0) {
    return sendError(res, 400, 'Cannot delete channel that is being used by news articles');
  }

  // Delete channel
  const success = await KanalInstansi.delete(id);
  
  if (!success) {
    return sendError(res, 500, 'Failed to delete institution channel');
  }

  logger.info(`Institution channel deleted: ${existingKanal.nama} by user ${req.user.id}`);

  sendSuccess(res, 200, 'Institution channel deleted successfully');
});

/**
 * Get current user's channels
 * @route GET /api/kanal-instansi/my-channels
 * @access Private (Instansi role)
 */
const getMyKanalInstansi = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'desc',
    search = ''
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    order,
    search,
    userId: req.user.id
  };

  const result = await KanalInstansi.findByUser(req.user.id, options);
  const meta = createPaginationMeta(options.page, options.limit, result.pagination.totalItems);

  sendSuccess(res, 200, 'Your institution channels retrieved successfully', {
    channels: result.channels.map(kanal => kanal.toJSON())
  }, meta);
});

/**
 * Get verified channels only
 * @route GET /api/kanal-instansi/verified
 * @access Public
 */
const getVerifiedKanalInstansi = asyncHandler(async (req, res) => {
  const channels = await KanalInstansi.getVerifiedChannels();

  sendSuccess(res, 200, 'Verified institution channels retrieved successfully', {
    channels: channels.map(kanal => kanal.toJSON())
  });
});

/**
 * Get channel statistics
 * @route GET /api/kanal-instansi/stats
 * @access Private (Admin only)
 */
const getKanalInstansiStats = asyncHandler(async (req, res) => {
  const db = require('../../config/database-connection');
  
  // Get channel statistics
  const statsQuery = `
    SELECT 
      COUNT(*) as total_channels,
      COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_channels,
      COUNT(CASE WHEN is_verified = 0 THEN 1 END) as unverified_channels,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_channels,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_channels,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as channels_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as channels_this_week,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as channels_this_month
    FROM kanal_instansi
  `;
  
  const stats = await db.query(statsQuery);

  // Get channel usage statistics
  const usageQuery = `
    SELECT ki.nama, ki.slug, COUNT(b.id) as news_count
    FROM kanal_instansi ki
    LEFT JOIN berita b ON ki.id = b.kanal_instansi_id
    WHERE ki.is_verified = 1 AND ki.is_active = 1
    GROUP BY ki.id, ki.nama, ki.slug
    ORDER BY news_count DESC
    LIMIT 10
  `;
  
  const usage = await db.query(usageQuery);

  sendSuccess(res, 200, 'Institution channel statistics retrieved successfully', {
    stats: stats[0],
    topChannels: usage
  });
});

module.exports = {
  getAllKanalInstansi,
  getKanalInstansiById,
  getKanalInstansiBySlug,
  createKanalInstansi,
  updateKanalInstansi,
  deleteKanalInstansi,
  getMyKanalInstansi,
  getVerifiedKanalInstansi,
  getKanalInstansiStats
};
