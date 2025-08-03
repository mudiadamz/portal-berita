/**
 * Database Connection Manager
 * Handles MySQL database connection with connection pooling
 */

const mysql = require('mysql2/promise');
const dbConfig = require('./database');
const logger = require('../src/utils/logger');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        queueLimit: 0
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('Database connection pool initialized successfully');
      return this.pool;
    } catch (error) {
      logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  /**
   * Get database connection from pool
   */
  async getConnection() {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool.getConnection();
  }

  /**
   * Execute a query with automatic connection management
   */
  async query(sql, params = []) {
    if (!this.pool) {
      await this.initialize();
    }

    try {
      // Use query() instead of execute() for dynamic SQL (ORDER BY, etc.)
      const [rows] = await this.pool.query(sql, params);
      return rows;
    } catch (error) {
      logger.error('Database query error:', { sql, params, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      logger.error('Transaction error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
