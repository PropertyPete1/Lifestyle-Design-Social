"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const dbStatus = await checkDatabaseHealth();
        const systemStatus = checkSystemHealth();
        const externalStatus = await checkExternalServices();
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            services: {
                database: dbStatus,
                system: systemStatus,
                external: externalStatus,
            },
        };
        const allHealthy = dbStatus.status === 'healthy' &&
            systemStatus.status === 'healthy' &&
            externalStatus.status === 'healthy';
        if (!allHealthy) {
            healthStatus.status = 'degraded';
        }
        const statusCode = allHealthy ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    }
    catch (error) {
        logger_1.logger.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        const dbStatus = await checkDatabaseHealth();
        if (dbStatus.status === 'healthy') {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                reason: 'Database connection failed',
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Readiness check error:', error);
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed',
        });
    }
});
router.get('/live', async (req, res) => {
    try {
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        });
    }
    catch (error) {
        logger_1.logger.error('Liveness check error:', error);
        res.status(503).json({
            status: 'dead',
            timestamp: new Date().toISOString(),
            error: 'Liveness check failed',
        });
    }
});
router.get('/metrics', async (req, res) => {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            process: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                pid: process.pid,
                version: process.version,
                platform: process.platform,
            },
            system: {
                loadAverage: process.platform === 'linux' ? require('os').loadavg() : null,
                totalMemory: require('os').totalmem(),
                freeMemory: require('os').freemem(),
                cpuCount: require('os').cpus().length,
            },
            database: await getDatabaseMetrics(),
        };
        res.json(metrics);
    }
    catch (error) {
        logger_1.logger.error('Metrics error:', error);
        res.status(500).json({
            error: 'Failed to get metrics',
            timestamp: new Date().toISOString(),
        });
    }
});
async function checkDatabaseHealth() {
    try {
        const client = await database_1.pool.connect();
        await client.query('SELECT 1');
        client.release();
        return {
            status: 'healthy',
            message: 'Database connection successful',
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return {
            status: 'unhealthy',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}
function checkSystemHealth() {
    try {
        const os = require('os');
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
        const status = {
            status: 'healthy',
            message: 'System resources are normal',
            timestamp: new Date().toISOString(),
            metrics: {
                memoryUsage: Math.round(memoryUsage * 100) / 100,
                totalMemory: totalMemory,
                freeMemory: freeMemory,
                cpuCount: os.cpus().length,
                platform: os.platform(),
                uptime: os.uptime(),
            },
        };
        if (memoryUsage > 90) {
            status.status = 'warning';
            status.message = 'High memory usage detected';
        }
        return status;
    }
    catch (error) {
        logger_1.logger.error('System health check failed:', error);
        return {
            status: 'unhealthy',
            message: 'System health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}
async function checkExternalServices() {
    try {
        const services = {
            status: 'healthy',
            message: 'All external services are available',
            timestamp: new Date().toISOString(),
            services: {},
        };
        if (process.env.INSTAGRAM_APP_ID) {
            try {
                const response = await fetch('https://graph.instagram.com/me?fields=id&access_token=test');
                services.services.instagram = {
                    status: 'available',
                    message: 'Instagram API is accessible',
                };
            }
            catch (error) {
                services.services.instagram = {
                    status: 'unavailable',
                    message: 'Instagram API is not accessible',
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
                services.status = 'degraded';
                services.message = 'Some external services are unavailable';
            }
        }
        return services;
    }
    catch (error) {
        logger_1.logger.error('External services check failed:', error);
        return {
            status: 'unhealthy',
            message: 'External services check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}
async function getDatabaseMetrics() {
    try {
        const client = await database_1.pool.connect();
        const result = await client.query(`
      SELECT 
        (SELECT count(*) FROM users) as user_count,
        (SELECT count(*) FROM videos) as video_count,
        (SELECT count(*) FROM posts) as post_count,
        (SELECT count(*) FROM posts WHERE status = 'posted') as posted_count,
        (SELECT count(*) FROM posts WHERE status = 'scheduled') as scheduled_count,
        (SELECT count(*) FROM posts WHERE status = 'failed') as failed_count
    `);
        client.release();
        return {
            status: 'healthy',
            metrics: result.rows[0],
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        logger_1.logger.error('Database metrics error:', error);
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
}
exports.default = router;
//# sourceMappingURL=health.js.map