"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const auth_1 = __importDefault(require("./routes/auth"));
const videos_1 = __importDefault(require("./routes/videos"));
const posts_1 = __importDefault(require("./routes/posts"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const instagram_1 = __importDefault(require("./routes/instagram"));
const captions_1 = __importDefault(require("./routes/captions"));
const health_1 = __importDefault(require("./routes/health"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
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
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'http://localhost:3000']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim()),
    },
}));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/posts', posts_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/instagram', instagram_1.default);
app.use('/api/captions', captions_1.default);
app.use('/api/health', health_1.default);
app.get('/', (req, res) => {
    res.json({
        message: 'Real Estate Auto-Posting API',
        version: '1.0.0',
        status: 'running',
        documentation: '/api/docs',
    });
});
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        await (0, database_1.initialize)();
        logger_1.logger.info('✅ Database initialized successfully');
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running on port ${PORT}`);
            logger_1.logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map