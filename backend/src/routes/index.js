/**
 * Main Routes Index
 * Combines all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const postRoutes = require('./posts'); // Legacy - keeping for backward compatibility
const beritaRoutes = require('./berita');
const kategoriRoutes = require('./kategori');
const kanalInstansiRoutes = require('./kanalInstansi');
const komentarRoutes = require('./komentar');
const bookmarkRoutes = require('./bookmarks');
const beritaKomentarRoutes = require('./beritaKomentar');

// Import middleware
const { sendSuccess } = require('../utils/response');

/**
 * @route   GET /api
 * @desc    API health check and information
 * @access  Public
 */
router.get('/', (req, res) => {
  sendSuccess(res, 200, 'Portal Berita API is running', {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts', // Legacy
      berita: '/api/berita',
      kategori: '/api/kategori',
      kanalInstansi: '/api/kanal-instansi',
      komentar: '/api/komentar',
      bookmarks: '/api/bookmarks'
    },
    documentation: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get current user profile',
        'PUT /api/auth/profile': 'Update current user profile',
        'PUT /api/auth/change-password': 'Change user password',
        'POST /api/auth/logout': 'Logout user'
      },
      users: {
        'GET /api/users': 'Get all users (Admin only)',
        'GET /api/users/:id': 'Get user by ID (Admin only)',
        'POST /api/users': 'Create new user (Admin only)',
        'PUT /api/users/:id': 'Update user (Admin only)',
        'DELETE /api/users/:id': 'Delete user (Admin only)',
        'GET /api/users/stats': 'Get user statistics (Admin only)'
      },
      posts: {
        'GET /api/posts': 'Get all posts (Legacy)',
        'GET /api/posts/:id': 'Get post by ID (Legacy)',
        'POST /api/posts': 'Create new post (Legacy)',
        'PUT /api/posts/:id': 'Update post (Legacy)',
        'DELETE /api/posts/:id': 'Delete post (Legacy)',
        'GET /api/posts/my-posts': 'Get current user posts (Legacy)',
        'GET /api/posts/categories': 'Get all categories (Legacy)',
        'GET /api/posts/stats': 'Get post statistics (Legacy)'
      },
      berita: {
        'GET /api/berita': 'Get all news articles',
        'GET /api/berita/:id': 'Get news by ID',
        'GET /api/berita/slug/:slug': 'Get news by slug',
        'POST /api/berita': 'Create news (Jurnalis, Admin, Instansi)',
        'PUT /api/berita/:id': 'Update news (Author, Admin, Jurnalis)',
        'PUT /api/berita/:id/status': 'Update news status (Admin, Jurnalis)',
        'DELETE /api/berita/:id': 'Delete news (Author, Admin, Jurnalis)',
        'GET /api/berita/my-articles': 'Get user articles (Auth required)',
        'GET /api/berita/stats': 'Get news statistics (Admin, Jurnalis)',
        'GET /api/berita/:id/komentar': 'Get comments for news',
        'POST /api/berita/:id/komentar': 'Add comment (Auth required)'
      },
      kategori: {
        'GET /api/kategori': 'Get all categories',
        'GET /api/kategori/:id': 'Get category by ID',
        'GET /api/kategori/slug/:slug': 'Get category by slug',
        'GET /api/kategori/active': 'Get active categories',
        'POST /api/kategori': 'Create category (Admin only)',
        'PUT /api/kategori/:id': 'Update category (Admin only)',
        'DELETE /api/kategori/:id': 'Delete category (Admin only)',
        'GET /api/kategori/stats': 'Get category statistics (Admin only)'
      },
      kanalInstansi: {
        'GET /api/kanal-instansi': 'Get all institution channels',
        'GET /api/kanal-instansi/:id': 'Get channel by ID',
        'GET /api/kanal-instansi/slug/:slug': 'Get channel by slug',
        'GET /api/kanal-instansi/verified': 'Get verified channels',
        'GET /api/kanal-instansi/my-channels': 'Get user channels (Instansi)',
        'POST /api/kanal-instansi': 'Create channel (Instansi only)',
        'PUT /api/kanal-instansi/:id': 'Update channel (Owner or Admin)',
        'DELETE /api/kanal-instansi/:id': 'Delete channel (Owner or Admin)',
        'GET /api/kanal-instansi/stats': 'Get channel statistics (Admin only)'
      },
      komentar: {
        'GET /api/komentar/:id': 'Get comment by ID',
        'PUT /api/komentar/:id': 'Update comment (Owner or Admin)',
        'DELETE /api/komentar/:id': 'Delete comment (Owner or Admin)',
        'POST /api/komentar/:id/report': 'Report comment (Auth required)',
        'GET /api/komentar/my-comments': 'Get user comments (Auth required)',
        'GET /api/komentar/stats': 'Get comment statistics (Admin only)'
      },
      bookmarks: {
        'GET /api/bookmarks': 'Get user bookmarks (Auth required)',
        'GET /api/bookmarks/:id': 'Get bookmark by ID (Auth required)',
        'POST /api/bookmarks': 'Add bookmark (Auth required)',
        'DELETE /api/bookmarks/:id': 'Remove bookmark (Auth required)',
        'DELETE /api/bookmarks/article/:id': 'Remove bookmark by article (Auth required)',
        'GET /api/bookmarks/check/:id': 'Check bookmark status (Auth required)',
        'GET /api/bookmarks/stats': 'Get bookmark statistics (Auth required)',
        'GET /api/bookmarks/by-category': 'Get bookmarks by category (Auth required)',
        'GET /api/bookmarks/recent': 'Get recent bookmarks (Auth required)',
        'DELETE /api/bookmarks/bulk': 'Bulk remove bookmarks (Auth required)'
      }
    }
  });
});

/**
 * @route   GET /api/health
 * @desc    Simple health check
 * @access  Public
 */
router.get('/health', (req, res) => {
  sendSuccess(res, 200, 'API is healthy', {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes); // Legacy - keeping for backward compatibility
router.use('/berita', beritaRoutes);
router.use('/berita', beritaKomentarRoutes); // Mount comment routes under berita
router.use('/kategori', kategoriRoutes);
router.use('/kanal-instansi', kanalInstansiRoutes);
router.use('/komentar', komentarRoutes);
router.use('/bookmarks', bookmarkRoutes);

module.exports = router;
