"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.get('/', async (_req, res) => {
    try {
        const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
        const healthData = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                type: 'MongoDB'
            },
            memory: process.memoryUsage(),
            version: process.version
        };
        logger_1.logger.info('Health check performed');
        return res.json(healthData);
    }
    catch (error) {
        logger_1.logger.error('Health check failed:', error);
        return res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map