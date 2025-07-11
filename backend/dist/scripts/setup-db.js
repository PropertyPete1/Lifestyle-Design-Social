"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = exports.checkDatabaseConnection = exports.resetDatabase = exports.setupDatabase = void 0;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
const migrate_1 = require("./migrate");
const seed_1 = require("./seed");
const pool = new pg_1.Pool({
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'real_estate_auto_posting',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
});
const checkDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        logger_1.logger.info('Database connection successful');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
const createDatabase = async () => {
    const defaultPool = new pg_1.Pool({
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        database: 'postgres',
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || 'password',
    });
    try {
        const client = await defaultPool.connect();
        const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [process.env['DB_NAME'] || 'real_estate_auto_posting']);
        if (result.rows.length === 0) {
            logger_1.logger.info('Creating database...');
            await client.query(`
        CREATE DATABASE "${process.env['DB_NAME'] || 'real_estate_auto_posting'}"
      `);
            logger_1.logger.info('Database created successfully');
        }
        else {
            logger_1.logger.info('Database already exists');
        }
        client.release();
    }
    catch (error) {
        logger_1.logger.error('Error creating database:', error);
        throw error;
    }
    finally {
        await defaultPool.end();
    }
};
exports.createDatabase = createDatabase;
const setupDatabase = async () => {
    try {
        logger_1.logger.info('Starting database setup...');
        await createDatabase();
        const isConnected = await checkDatabaseConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to database');
        }
        logger_1.logger.info('Running migrations...');
        await (0, migrate_1.runMigrations)();
        logger_1.logger.info('Seeding database...');
        await (0, seed_1.runSeed)();
        logger_1.logger.info('Database setup completed successfully!');
        logger_1.logger.info('\n🎉 Your Real Estate Auto-Posting App database is ready!');
        logger_1.logger.info('\n📋 Next steps:');
        logger_1.logger.info('1. Start the backend server: npm run dev');
        logger_1.logger.info('2. Start the frontend: cd ../client && npm start');
        logger_1.logger.info('3. Login with demo credentials:');
        logger_1.logger.info('   Email: demo@lifestyledesignrealty.com');
        logger_1.logger.info('   Password: demo123');
    }
    catch (error) {
        logger_1.logger.error('Database setup failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
};
exports.setupDatabase = setupDatabase;
const resetDatabase = async () => {
    try {
        logger_1.logger.info('Resetting database...');
        const defaultPool = new pg_1.Pool({
            host: process.env['DB_HOST'] || 'localhost',
            port: parseInt(process.env['DB_PORT'] || '5432'),
            database: 'postgres',
            user: process.env['DB_USER'] || 'postgres',
            password: process.env['DB_PASSWORD'] || 'password',
        });
        const client = await defaultPool.connect();
        await client.query(`
      DROP DATABASE IF EXISTS "${process.env['DB_NAME'] || 'real_estate_auto_posting'}"
    `);
        client.release();
        await defaultPool.end();
        logger_1.logger.info('Database dropped successfully');
        await setupDatabase();
    }
    catch (error) {
        logger_1.logger.error('Database reset failed:', error);
        process.exit(1);
    }
};
exports.resetDatabase = resetDatabase;
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
                await (0, migrate_1.runMigrations)();
                break;
            case 'seed':
                await (0, seed_1.runSeed)();
                break;
            default:
                logger_1.logger.info('Usage: npm run setup-db [setup|reset|migrate|seed]');
                logger_1.logger.info('  setup   - Create database, run migrations, and seed data');
                logger_1.logger.info('  reset   - Drop database and recreate everything');
                logger_1.logger.info('  migrate - Run database migrations only');
                logger_1.logger.info('  seed    - Seed database with sample data only');
                process.exit(1);
        }
    }
    catch (error) {
        logger_1.logger.error('Database setup script failed:', error);
        process.exit(1);
    }
};
if (require.main === module) {
    main();
}
//# sourceMappingURL=setup-db.js.map