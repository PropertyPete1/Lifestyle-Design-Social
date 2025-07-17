"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromDatabase = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
let isConnected = false;
const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/auto_posting_app";
        await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        logger_1.logger.info('Connected to MongoDB successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
};
exports.connectToDatabase = connectToDatabase;
const disconnectFromDatabase = async () => {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose_1.default.disconnect();
        isConnected = false;
        logger_1.logger.info('Disconnected from MongoDB');
    }
    catch (error) {
        logger_1.logger.error('Failed to disconnect from MongoDB:', error);
        throw error;
    }
};
exports.disconnectFromDatabase = disconnectFromDatabase;
mongoose_1.default.connection.on('connected', () => {
    isConnected = true;
    logger_1.logger.info('MongoDB connection established');
});
mongoose_1.default.connection.on('error', (error) => {
    logger_1.logger.error('MongoDB connection error:', error);
    isConnected = false;
});
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.info('MongoDB disconnected');
    isConnected = false;
});
exports.default = {
    connectToDatabase: exports.connectToDatabase,
    disconnectFromDatabase: exports.disconnectFromDatabase
};
