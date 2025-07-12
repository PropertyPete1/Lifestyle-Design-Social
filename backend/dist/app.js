"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const videos_1 = __importDefault(require("./routes/videos"));
const posts_1 = __importDefault(require("./routes/posts"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const health_1 = __importDefault(require("./routes/health"));
dotenv_1.default.config();
class RealEstateAutoPostingApp {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = require('http').createServer(this.app);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.set('trust proxy', 1);
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: config_1.config.cors.origins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
                'X-API-Key',
                'X-Request-ID',
            ],
        }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 1000,
            message: {
                error: 'Too many requests from this IP, please try again later.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api/', limiter);
        this.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
        this.app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
    }
    setupRoutes() {
        this.app.use('/health', health_1.default);
        this.app.use('/api/health', health_1.default);
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/videos', videos_1.default);
        this.app.use('/api/posts', posts_1.default);
        this.app.use('/api/analytics', analytics_1.default);
        if (config_1.config.nodeEnv === 'development') {
            this.app.get('/api/docs', (req, res) => {
                res.json({
                    message: 'Real Estate Auto-Posting API Documentation',
                    version: '1.0.0',
                    endpoints: {
                        auth: '/api/auth',
                        videos: '/api/videos',
                        posts: '/api/posts',
                        analytics: '/api/analytics',
                        health: '/api/health',
                    },
                });
            });
        }
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Real Estate Auto-Posting SaaS API',
                version: '1.0.0',
                status: 'operational',
                timestamp: new Date().toISOString(),
                environment: config_1.config.nodeEnv,
            });
        });
    }
    setupErrorHandling() {
        this.app.use(notFoundHandler_1.notFoundHandler);
        this.app.use((error, req, res, next) => {
            logger_1.logger.error('Global error handler:', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            const isDevelopment = config_1.config.nodeEnv === 'development';
            const response = {
                success: false,
                error: isDevelopment ? error.message : 'Internal server error',
                timestamp: new Date().toISOString(),
            };
            res.status(error.statusCode || 500).json(response);
        });
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
            try {
                this.server.close(() => {
                    logger_1.logger.info('HTTP server closed');
                });
                logger_1.logger.info('Graceful shutdown completed');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during graceful shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught exception:', error);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }
    async start() {
        try {
            logger_1.logger.info('🚀 Starting Real Estate Auto-Posting SaaS Application...');
            await (0, database_1.initialize)();
            logger_1.logger.info('✅ Database initialized');
            this.setupGracefulShutdown();
            const port = config_1.config.port || 3001;
            this.server.listen(port, () => {
                logger_1.logger.info(`🎉 Server running on port ${port}`);
                logger_1.logger.info(`📊 Environment: ${config_1.config.nodeEnv}`);
                logger_1.logger.info(`🔗 Health check: http://localhost:${port}/health`);
                logger_1.logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`);
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start application:', error);
            process.exit(1);
        }
    }
}
exports.app = new RealEstateAutoPostingApp();
if (require.main === module) {
    exports.app.start().catch((error) => {
        console.error('Failed to start application:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=app.js.map