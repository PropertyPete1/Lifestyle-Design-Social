import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { runMigrations } from './migrate';
import { runSeed } from './seed';

// Database configuration
const pool = new Pool({
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'real_estate_auto_posting',
  user: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
});

// Check database connection
const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Create database if it doesn't exist
const createDatabase = async (): Promise<void> => {
  // Connect to default postgres database
  const defaultPool = new Pool({
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: 'postgres',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
  });

  try {
    const client = await defaultPool.connect();
    
    // Check if database exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [process.env['DB_NAME'] || 'real_estate_auto_posting']);
    
    if (result.rows.length === 0) {
      logger.info('Creating database...');
      await client.query(`
        CREATE DATABASE "${process.env['DB_NAME'] || 'real_estate_auto_posting'}"
      `);
      logger.info('Database created successfully');
    } else {
      logger.info('Database already exists');
    }
    
    client.release();
  } catch (error) {
    logger.error('Error creating database:', error);
    throw error;
  } finally {
    await defaultPool.end();
  }
};

// Setup database
const setupDatabase = async (): Promise<void> => {
  try {
    logger.info('Starting database setup...');
    
    // Create database if it doesn't exist
    await createDatabase();
    
    // Check connection to the target database
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }
    
    // Run migrations
    logger.info('Running migrations...');
    await runMigrations();
    
    // Run seed data
    logger.info('Seeding database...');
    await runSeed();
    
    logger.info('Database setup completed successfully!');
    logger.info('\n🎉 Your Real Estate Auto-Posting App database is ready!');
    logger.info('\n📋 Next steps:');
    logger.info('1. Start the backend server: npm run dev');
    logger.info('2. Start the frontend: cd ../client && npm start');
    logger.info('3. Login with demo credentials:');
    logger.info('   Email: demo@lifestyledesignrealty.com');
    logger.info('   Password: demo123');
    
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Reset database (drop and recreate)
const resetDatabase = async (): Promise<void> => {
  try {
    logger.info('Resetting database...');
    
    // Connect to default postgres database
    const defaultPool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: 'postgres',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'password',
    });

    const client = await defaultPool.connect();
    
    // Drop database if it exists
    await client.query(`
      DROP DATABASE IF EXISTS "${process.env['DB_NAME'] || 'real_estate_auto_posting'}"
    `);
    
    client.release();
    await defaultPool.end();
    
    logger.info('Database dropped successfully');
    
    // Recreate and setup database
    await setupDatabase();
    
  } catch (error) {
    logger.error('Database reset failed:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'setup':
        await setupDatabase();
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'migrate':
        await runMigrations();
        break;
      case 'seed':
        await runSeed();
        break;
      default:
        logger.info('Usage: npm run setup-db [setup|reset|migrate|seed]');
        logger.info('  setup   - Create database, run migrations, and seed data');
        logger.info('  reset   - Drop database and recreate everything');
        logger.info('  migrate - Run database migrations only');
        logger.info('  seed    - Seed database with sample data only');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Database setup script failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export {
  setupDatabase,
  resetDatabase,
  checkDatabaseConnection,
  createDatabase,
}; 