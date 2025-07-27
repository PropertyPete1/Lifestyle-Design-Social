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
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let isConnected = false;
async function connectToDatabase() {
    if (isConnected) {
        return;
    }
    try {
        // Load MongoDB URI from backend settings.json or environment
        const settingsPath = path.resolve(__dirname, '../../settings.json');
        const backupSettingsPath = path.resolve(__dirname, '../../../settings.json');
        let mongoUri = process.env.MONGODB_URI;
        // Try backend/settings.json first, then root settings.json
        const pathsToCheck = [settingsPath, backupSettingsPath];
        for (const settingsFile of pathsToCheck) {
            if (fs.existsSync(settingsFile)) {
                try {
                    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
                    mongoUri = settings.mongoUri || settings.mongoDbUri || mongoUri;
                    if (mongoUri)
                        break;
                }
                catch (e) {
                    // Ignore parse errors and try next file
                }
            }
        }
        if (!mongoUri) {
            // Use default local MongoDB if no URI provided
            mongoUri = 'mongodb://localhost:27017/lifestyle-design-auto-poster';
        }
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000, // 30 second timeout
            maxPoolSize: 10
        });
        isConnected = true;
        console.log('Connected to MongoDB:', mongoUri.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        throw error;
    }
}
async function disconnectFromDatabase() {
    if (isConnected) {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log('Disconnected from MongoDB');
    }
}
