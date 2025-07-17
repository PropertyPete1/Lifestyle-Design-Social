"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const analytics_1 = __importDefault(require("./routes/analytics"));
const auth_2 = __importDefault(require("./routes/auth"));
const autoPost_1 = __importDefault(require("./routes/autoPost"));
const captions_1 = __importDefault(require("./routes/captions"));
const health_1 = __importDefault(require("./routes/health"));
const instagram_1 = __importDefault(require("./routes/instagram"));
const instagramLearning_1 = __importDefault(require("./routes/instagramLearning"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const oauth_1 = __importDefault(require("./routes/oauth"));
const posts_1 = __importDefault(require("./routes/posts"));
const settings_1 = __importDefault(require("./routes/settings"));
const videos_1 = __importDefault(require("./routes/videos"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.CORS_ORIGINS?.split(',') || ['https://lifestyle-design-social.vercel.app'])
        : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
    });
    next();
});
app.use('/api/health', health_1.default);
app.use('/api/auth', auth_2.default);
app.use('/api/oauth', oauth_1.default);
app.use('/api/autopost', autoPost_1.default);
app.use('/api/analytics', auth_1.authenticateToken, analytics_1.default);
app.use('/api/captions', auth_1.authenticateToken, captions_1.default);
app.use('/api/instagram', auth_1.authenticateToken, instagram_1.default);
app.use('/api/instagram-learning', auth_1.authenticateToken, instagramLearning_1.default);
app.use('/api/notifications', auth_1.authenticateToken, notifications_1.default);
app.use('/api/posts', auth_1.authenticateToken, posts_1.default);
app.use('/api/settings', auth_1.authenticateToken, settings_1.default);
app.use('/api/videos', auth_1.authenticateToken, videos_1.default);
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
        await mongoose_1.default.disconnect();
        logger_1.logger.info('Database connection closed');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
const startServer = async () => {
    try {
        await (0, database_1.connectToDatabase)();
        logger_1.logger.info('Database connected successfully');
        const uploadDirs = [
            path_1.default.join(__dirname, '../uploads'),
            path_1.default.join(__dirname, '../uploads/videos'),
            path_1.default.join(__dirname, '../uploads/videos/thumbnails'),
            path_1.default.join(__dirname, '../uploads/videos/compressed'),
            path_1.default.join(__dirname, '../uploads/watermarked'),
            path_1.default.join(__dirname, '../uploads/watermarks'),
        ];
        uploadDirs.forEach(dir => {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
                logger_1.logger.info(`Created directory: ${dir}`);
            }
        });
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server is running on port ${PORT}`);
            logger_1.logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`🔗 API available at: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map