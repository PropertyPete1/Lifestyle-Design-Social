"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showMigrationStatus = exports.rollbackLastMigration = exports.runMigrations = void 0;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'real_estate_auto_posting',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
});
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
        logger_1.logger.info('Migrations table created/verified');
    }
    catch (error) {
        logger_1.logger.error('Error creating migrations table:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
const getMigrationFiles = () => {
    const migrationsDir = path_1.default.join(__dirname, 'migrations');
    const files = fs_1.default.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    return files;
};
const isMigrationExecuted = async (filename) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id FROM migrations WHERE filename = $1', [filename]);
        return result.rows.length > 0;
    }
    catch (error) {
        logger_1.logger.error('Error checking migration status:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
const markMigrationExecuted = async (filename) => {
    const client = await pool.connect();
    try {
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        logger_1.logger.info(`Migration ${filename} marked as executed`);
    }
    catch (error) {
        logger_1.logger.error('Error marking migration as executed:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
const executeMigration = async (filename) => {
    const client = await pool.connect();
    try {
        const filePath = path_1.default.join(__dirname, 'migrations', filename);
        const sql = fs_1.default.readFileSync(filePath, 'utf8');
        logger_1.logger.info(`Executing migration: ${filename}`);
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        await markMigrationExecuted(filename);
        logger_1.logger.info(`Migration ${filename} executed successfully`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error(`Error executing migration ${filename}:`, error);
        throw error;
    }
    finally {
        client.release();
    }
};
const runMigrations = async () => {
    try {
        logger_1.logger.info('Starting database migrations...');
        await createMigrationsTable();
        const migrationFiles = getMigrationFiles();
        logger_1.logger.info(`Found ${migrationFiles.length} migration files`);
        let executedCount = 0;
        for (const filename of migrationFiles) {
            const isExecuted = await isMigrationExecuted(filename);
            if (!isExecuted) {
                await executeMigration(filename);
                executedCount++;
            }
            else {
                logger_1.logger.info(`Migration ${filename} already executed, skipping`);
            }
        }
        logger_1.logger.info(`Migration completed. ${executedCount} migrations executed.`);
    }
    catch (error) {
        logger_1.logger.error('Migration failed:', error);
        process.exit(1);
    }
};
exports.runMigrations = runMigrations;
const rollbackLastMigration = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT filename FROM migrations ORDER BY id DESC LIMIT 1');
        if (result.rows.length === 0) {
            logger_1.logger.info('No migrations to rollback');
            return;
        }
        const lastMigration = result.rows[0].filename;
        logger_1.logger.info(`Rolling back migration: ${lastMigration}`);
        await client.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
        logger_1.logger.info(`Migration ${lastMigration} rolled back`);
    }
    catch (error) {
        logger_1.logger.error('Rollback failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.rollbackLastMigration = rollbackLastMigration;
const showMigrationStatus = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT filename, executed_at FROM migrations ORDER BY id');
        logger_1.logger.info('Migration Status:');
        result.rows.forEach(row => {
            logger_1.logger.info(`  ✓ ${row.filename} (${row.executed_at})`);
        });
        const migrationFiles = getMigrationFiles();
        const executedFiles = result.rows.map(row => row.filename);
        const pendingFiles = migrationFiles.filter(file => !executedFiles.includes(file));
        if (pendingFiles.length > 0) {
            logger_1.logger.info('\nPending migrations:');
            pendingFiles.forEach(file => {
                logger_1.logger.info(`  ⏳ ${file}`);
            });
        }
        else {
            logger_1.logger.info('\nAll migrations are up to date');
        }
    }
    catch (error) {
        logger_1.logger.error('Error showing migration status:', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.showMigrationStatus = showMigrationStatus;
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
                logger_1.logger.info('Usage: npm run migrate [run|rollback|status]');
                logger_1.logger.info('  run     - Execute pending migrations');
                logger_1.logger.info('  rollback - Rollback last migration');
                logger_1.logger.info('  status   - Show migration status');
                process.exit(1);
        }
    }
    catch (error) {
        logger_1.logger.error('Migration script failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
};
if (require.main === module) {
    main();
}
//# sourceMappingURL=migrate.js.map