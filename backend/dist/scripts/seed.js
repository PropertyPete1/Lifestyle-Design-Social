"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = exports.runSeed = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const seedData = {
    users: [],
};
const seedUsers = async () => {
    logger_1.logger.info('🌱 Production seed - No demo users will be created');
    logger_1.logger.info('📝 Users must register through the application UI at /register');
    if (seedData.users.length === 0) {
        logger_1.logger.info('✅ Seed script ready - database will only contain user-registered accounts');
        return;
    }
    for (const userData of seedData.users) {
        try {
            const existingUser = await User_1.User.findOne({ email: userData.email });
            if (!existingUser) {
                const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
                const newUser = new User_1.User({
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    username: userData.username || null,
                    autoPostingEnabled: userData.autoPostingEnabled,
                    postingTimes: userData.postingTimes,
                    timezone: userData.timezone,
                    testMode: userData.testMode,
                });
                await newUser.save();
                logger_1.logger.info(`✅ Created user: ${userData.email}`);
            }
            else {
                logger_1.logger.info(`⏭️  User already exists: ${userData.email}`);
            }
        }
        catch (error) {
            logger_1.logger.error(`❌ Error seeding user ${userData.email}:`, error);
        }
    }
};
exports.seedUsers = seedUsers;
const runSeed = async () => {
    try {
        logger_1.logger.info('🌱 Starting production database seeding...');
        await (0, database_1.connectToDatabase)();
        await seedUsers();
        logger_1.logger.info('✅ Production database seeding completed successfully');
        logger_1.logger.info('📋 To create your first user, visit: http://localhost:3000/register');
    }
    catch (error) {
        logger_1.logger.error('❌ Database seeding failed:', error);
        throw error;
    }
};
exports.runSeed = runSeed;
if (require.main === module) {
    runSeed()
        .then(() => {
        logger_1.logger.info('Production seed script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.logger.error('Production seed script failed:', error);
        process.exit(1);
    });
}
