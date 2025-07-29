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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load API keys from settings.json FIRST, before any other imports
const settingsPath = path.resolve(__dirname, '../frontend/settings.json');
console.log(`🔧 Loading settings from: ${settingsPath}`);
if (fs.existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        console.log(`✅ Settings loaded: ${Object.keys(settings).length} keys`);
        for (const [key, value] of Object.entries(settings)) {
            if (value && !process.env[key]) {
                process.env[key] = String(value);
                if (key === 'youtubeApiKey') {
                    console.log(`🔑 YouTube API Key loaded: ${String(value).substring(0, 10)}...`);
                }
            }
        }
    }
    catch (e) {
        console.error(`❌ Failed to parse settings:`, e);
    }
}
else {
    console.warn(`⚠️ Settings file not found at: ${settingsPath}`);
}
// Now import everything else after settings are loaded
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const index_1 = __importDefault(require("./src/routes/index"));
const phase9_1 = __importDefault(require("./src/routes/api/phase9"));
const insights_1 = __importDefault(require("./src/routes/api/insights"));
const schedulePostJob_1 = require("./src/lib/youtube/schedulePostJob");
const migrateFilePaths_1 = require("./src/lib/youtube/migrateFilePaths");
const dropboxMonitor_1 = require("./src/services/dropboxMonitor");
const repostMonitor_1 = require("./src/services/repostMonitor");
const audioMatchingScheduler_1 = require("./src/services/audioMatchingScheduler");
const scheduler_1 = require("./src/lib/peakHours/scheduler");
const phase9Monitor_1 = require("./src/services/phase9Monitor");
const dailyHashtagRefresh_1 = require("./src/services/dailyHashtagRefresh");
const app = (0, express_1.default)();
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
app.use(express_1.default.static(path.join(__dirname, 'public')));
app.use('/api', index_1.default);
app.use('/api/phase9', phase9_1.default);
app.use('/api/insights', insights_1.default);
// Initialize all scheduled services
async function initializeServices() {
    try {
        console.log('🚀 Initializing backend services...');
        // Initialize database migration
        await (0, migrateFilePaths_1.migrateFilePaths)();
        // Start scheduled jobs
        (0, schedulePostJob_1.initializeScheduledJobs)();
        // Start monitoring services
        (0, dropboxMonitor_1.startDropboxMonitoring)();
        repostMonitor_1.repostMonitor.startMonitoring();
        audioMatchingScheduler_1.audioMatchingScheduler.start();
        scheduler_1.peakHoursScheduler.startScheduler();
        // smartRepostTrigger starts automatically in constructor
        phase9Monitor_1.phase9Monitor.start();
        // Start daily hashtag refresh service
        dailyHashtagRefresh_1.dailyHashtagRefresh.start();
        console.log('✅ All backend services initialized successfully');
    }
    catch (error) {
        console.error('❌ Error initializing services:', error);
    }
}
// Run migration and initialize scheduled jobs on server start
(async () => {
    try {
        // Import here to avoid circular dependency
        const { connectToDatabase } = await Promise.resolve().then(() => __importStar(require('./src/database/connection')));
        // Connect to database first
        console.log('🔌 Connecting to database...');
        await connectToDatabase();
        // Initialize all services
        await initializeServices();
        console.log('🚀 Backend fully initialized with ALL PHASES (1-9) complete');
    }
    catch (error) {
        console.error('❌ Failed to initialize backend:', error);
    }
})();
exports.default = app;
