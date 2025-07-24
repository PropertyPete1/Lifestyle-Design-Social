"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Try to load from settings.json (used by the app's settings UI)
const settingsPath = path_1.default.resolve(__dirname, '../../../frontend/settings.json');
let mongoDbUri = process.env.MONGODB_URI || '';
if (!mongoDbUri && fs_1.default.existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf-8'));
        mongoDbUri = settings.mongoDbUri || '';
    }
    catch (e) {
        console.error('Failed to read MongoDB URI from settings.json:', e);
    }
}
if (!mongoDbUri) {
    throw new Error('MongoDB URI not set in environment or settings.json');
}
function connectMongo() {
    return mongoose_1.default.connect(mongoDbUri);
}
