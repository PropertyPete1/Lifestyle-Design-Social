"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./src/routes/index"));
const schedulePostJob_1 = require("./src/lib/youtube/schedulePostJob");
const migrateFilePaths_1 = require("./src/lib/youtube/migrateFilePaths");
const dropboxMonitor_1 = require("./src/services/dropboxMonitor");
const repostMonitor_1 = require("./src/services/repostMonitor");
const audioMatchingScheduler_1 = require("./src/services/audioMatchingScheduler");
const scheduler_1 = require("./src/lib/peakHours/scheduler");
const smartRepostTrigger_1 = require("./src/lib/repost/smartRepostTrigger");
const fs = __importStar(require("fs"));
const app = (0, express_1.default)();
// Load API keys from settings.json if present
const settingsPath = path_1.default.resolve(__dirname, '../frontend/settings.json');
if (fs.existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        for (const [key, value] of Object.entries(settings)) {
            if (value && !process.env[key]) {
                process.env[key] = String(value);
            }
        }
    }
    catch (e) {
        // Ignore parse errors, fallback to .env
    }
}
// CORS for all routes and preflight
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));
// Explicitly handle preflight for all routes
app.options('*', (0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || origin === 'http://localhost:3000' || origin === 'http://localhost:3001') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use('/api', index_1.default);
// Run migration and initialize scheduled jobs on server start
(async () => {
    try {
        // Import here to avoid circular dependency
        const { connectToDatabase } = await Promise.resolve().then(() => __importStar(require('./src/database/connection')));
        // Connect to database first
        console.log('🔌 Connecting to database...');
        await connectToDatabase();
        console.log('🔄 Running migrations...');
        await (0, migrateFilePaths_1.migrateFilePaths)();
        console.log('⏰ Initializing scheduled jobs...');
        await (0, schedulePostJob_1.initializeScheduledJobs)();
        console.log('📁 Starting Dropbox monitoring...');
        (0, dropboxMonitor_1.startDropboxMonitoring)();
        // Start repost monitoring (Phase 2)
        console.log('🎯 Starting repost monitoring...');
        repostMonitor_1.repostMonitor.startMonitoring(60); // Check every hour
        // Start audio matching scheduler (Phase 3)
        console.log('🎵 Starting audio matching scheduler...');
        audioMatchingScheduler_1.audioMatchingScheduler.start();
        // Start peak hours scheduler (Phase 6)
        console.log('🕒 Starting peak hours scheduler...');
        scheduler_1.peakHoursScheduler.startScheduler();
        // Start smart repost trigger (Phase 7)
        console.log('🔄 Starting smart repost trigger...');
        smartRepostTrigger_1.smartRepostTrigger.startTrigger();
        console.log('🚀 Backend fully initialized with ALL PHASES (1-7) complete');
    }
    catch (error) {
        console.error('❌ Failed to initialize backend:', error);
    }
})();
exports.default = app;
