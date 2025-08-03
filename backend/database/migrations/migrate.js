/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const dbName = process.env.DB_NAME || 'portal_berita';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Run migrations
 */
async function runMigrations() {
  // Create database first
  await createDatabase();
  
  // Connect to the specific database
  const connection = await mysql.createConnection({
    ...dbConfig,
    database: process.env.DB_NAME || 'portal_berita',
    multipleStatements: true
  });

  try {
    console.log('🚀 Starting database migrations...\n');

    // Create migrations tracking table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('📝 No migration files found');
      return;
    }

    // Check which migrations have already been run
    const [executedMigrations] = await connection.execute(
      'SELECT filename FROM migrations'
    );
    const executedFiles = executedMigrations.map(row => row.filename);

    // Run pending migrations
    for (const file of files) {
      if (executedFiles.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${file}`);
      
      try {
        // Read and execute migration file
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration (use query for multiple statements)
        await connection.query(migrationSQL);
        
        // Record the migration as executed
        await connection.execute(
          'INSERT INTO migrations (filename) VALUES (?)',
          [file]
        );
        
        console.log(`✅ Successfully executed: ${file}`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    
    // Show summary
    const [allMigrations] = await connection.execute(
      'SELECT filename, executed_at FROM migrations ORDER BY executed_at'
    );
    
    console.log('\n📋 Migration History:');
    allMigrations.forEach(migration => {
      console.log(`   ${migration.filename} - ${migration.executed_at}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

/**
 * Reset database (drop and recreate)
 */
async function resetDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const dbName = process.env.DB_NAME || 'portal_berita';
    console.log(`🗑️  Dropping database '${dbName}'...`);
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' dropped`);
    
    // Run migrations after reset
    await runMigrations();
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'reset':
    resetDatabase();
    break;
  case 'migrate':
  default:
    runMigrations();
    break;
}

module.exports = {
  runMigrations,
  resetDatabase,
  createDatabase
};
