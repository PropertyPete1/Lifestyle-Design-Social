import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'real_estate_auto_posting',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Migration table to track executed migrations
const createMigrationsTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('Migrations table created/verified');
  } catch (error) {
    logger.error('Error creating migrations table:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get list of migration files
const getMigrationFiles = (): string[] => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations run in order
  return files;
};

// Check if migration has been executed
const isMigrationExecuted = async (filename: string): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id FROM migrations WHERE filename = $1',
      [filename]
    );
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Error checking migration status:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Mark migration as executed
const markMigrationExecuted = async (filename: string) => {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    logger.info(`Migration ${filename} marked as executed`);
  } catch (error) {
    logger.error('Error marking migration as executed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Execute a single migration
const executeMigration = async (filename: string) => {
  const client = await pool.connect();
  try {
    const filePath = path.join(__dirname, 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    logger.info(`Executing migration: ${filename}`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    await markMigrationExecuted(filename);
    logger.info(`Migration ${filename} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error executing migration ${filename}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

// Run all pending migrations
const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get all migration files
    const migrationFiles = getMigrationFiles();
    logger.info(`Found ${migrationFiles.length} migration files`);
    
    let executedCount = 0;
    
    for (const filename of migrationFiles) {
      const isExecuted = await isMigrationExecuted(filename);
      
      if (!isExecuted) {
        await executeMigration(filename);
        executedCount++;
      } else {
        logger.info(`Migration ${filename} already executed, skipping`);
      }
    }
    
    logger.info(`Migration completed. ${executedCount} migrations executed.`);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

// Rollback last migration
const rollbackLastMigration = async () => {
  const client = await pool.connect();
  try {
    // Get the last executed migration
    const result = await client.query(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].filename;
    logger.info(`Rolling back migration: ${lastMigration}`);
    
    // Note: This is a simplified rollback. In production, you'd want
    // to implement proper rollback logic for each migration
    await client.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
    logger.info(`Migration ${lastMigration} rolled back`);
  } catch (error) {
    logger.error('Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Show migration status
const showMigrationStatus = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT filename, executed_at FROM migrations ORDER BY id'
    );
    
    logger.info('Migration Status:');
    result.rows.forEach(row => {
      logger.info(`  ✓ ${row.filename} (${row.executed_at})`);
    });
    
    const migrationFiles = getMigrationFiles();
    const executedFiles = result.rows.map(row => row.filename);
    const pendingFiles = migrationFiles.filter(file => !executedFiles.includes(file));
    
    if (pendingFiles.length > 0) {
      logger.info('\nPending migrations:');
      pendingFiles.forEach(file => {
        logger.info(`  ⏳ ${file}`);
      });
    } else {
      logger.info('\nAll migrations are up to date');
    }
  } catch (error) {
    logger.error('Error showing migration status:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Main function
const main = async () => {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'run':
        await runMigrations();
        break;
      case 'rollback':
        await rollbackLastMigration();
        break;
      case 'status':
        await showMigrationStatus();
        break;
      default:
        logger.info('Usage: npm run migrate [run|rollback|status]');
        logger.info('  run     - Execute pending migrations');
        logger.info('  rollback - Rollback last migration');
        logger.info('  status   - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export {
  runMigrations,
  rollbackLastMigration,
  showMigrationStatus,
}; 