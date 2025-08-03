/**
 * Portal Berita API
 * Express.js application with MySQL database integration
 * Features: Authentication, Authorization, CRUD operations, Rate limiting
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Import configuration
const config = require('./config/app');
const dbConnection = require('./config/database-connection');

// Import middleware
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { generalLimiter } = require('./src/middleware/rateLimiter');

// Import routes
const apiRoutes = require('./src/routes');

// Import utilities
const logger = require('./src/utils/logger');

// Create Express application
const app = express();

/**
 * Security Middleware
 */
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * General Middleware
 */
// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
app.use(generalLimiter);

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: '1.0.0'
    }
  });
});

/**
 * API Routes
 */
app.use('/portalapi', apiRoutes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Portal Berita API',
    data: {
      version: '1.0.0',
      environment: config.env,
      timestamp: new Date().toISOString(),
      documentation: '/api',
      health: '/health'
    }
  });
});

/**
 * Error Handling Middleware
 */
// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Database Connection and Server Startup
 */
async function startServer() {
  try {
    // Initialize database connection
    await dbConnection.initialize();
    logger.info('Database connection established');

    // Start server
    const server = app.listen(config.port, config.host, () => {
      logger.info(`🚀 Server running on http://${config.host}:${config.port}`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`📚 API Documentation: http://${config.host}:${config.port}/api`);
      logger.info(`❤️  Health Check: http://${config.host}:${config.port}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await dbConnection.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
