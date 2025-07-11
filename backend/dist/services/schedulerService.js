"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
const Post_1 = require("../models/Post");
const database_1 = require("../config/database");
const autoPostingService_1 = require("./autoPostingService");
const analyticsService_1 = require("./analyticsService");
class SchedulerService {
    constructor() {
        this.userModel = new User_1.UserModel(database_1.pool);
        this.postModel = new Post_1.PostModel(database_1.pool);
        this.autoPostingService = new autoPostingService_1.AutoPostingService();
        this.analyticsService = new analyticsService_1.AnalyticsService();
    }
    async schedulePosts(userId, days = 7) {
        try {
            logger_1.logger.info(`Scheduling posts for user ${userId} for ${days} days`);
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const config = {
                userId,
                enabled: user.autoPostingEnabled || false,
                times: user.postingTimes || ['09:00', '13:00', '18:00'],
                days: [1, 2, 3, 4, 5, 6, 7],
                postsPerDay: 3,
                categoryRotation: ['real-estate', 'cartoon'],
                timezone: user.timezone || 'America/Chicago',
                testMode: user.testMode || false,
            };
            if (!config.enabled) {
                return {
                    success: false,
                    scheduledPosts: 0,
                    errors: ['Auto-posting is disabled for this user'],
                    nextExecution: new Date(),
                };
            }
            const results = await this.autoPostingService.schedulePosts(userId, days);
            const successCount = results.filter(r => r.success).length;
            const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');
            const nextExecution = this.calculateNextExecution(config);
            logger_1.logger.info(`Scheduled ${successCount} posts for user ${userId}`);
            return {
                success: successCount > 0,
                scheduledPosts: successCount,
                errors,
                nextExecution,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule posts:', error);
            return {
                success: false,
                scheduledPosts: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                nextExecution: new Date(),
            };
        }
    }
    async executeScheduledPosts() {
        try {
            logger_1.logger.info('Executing scheduled posts...');
            const now = new Date();
            const scheduledPosts = await this.postModel.findByStatus('scheduled', {
                scheduledTime: { $lte: now },
            });
            if (scheduledPosts.length === 0) {
                logger_1.logger.info('No scheduled posts to execute');
                return {
                    success: true,
                    scheduledPosts: 0,
                    errors: [],
                    nextExecution: this.calculateNextExecutionTime(),
                };
            }
            const results = await this.autoPostingService.executeScheduledPosts();
            const successCount = results.filter(r => r.success).length;
            const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');
            logger_1.logger.info(`Executed ${successCount} scheduled posts`);
            return {
                success: successCount > 0,
                scheduledPosts: successCount,
                errors,
                nextExecution: this.calculateNextExecutionTime(),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to execute scheduled posts:', error);
            return {
                success: false,
                scheduledPosts: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                nextExecution: new Date(),
            };
        }
    }
    async optimizePostingTimes(userId) {
        try {
            logger_1.logger.info(`Optimizing posting times for user ${userId}`);
            const engagementData = await this.analyticsService.getBestPostingTimes(userId, 90);
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const bestTimes = engagementData.bestTimes || ['09:00', '13:00', '18:00'];
            const bestDays = [1, 2, 3, 4, 5, 6, 7];
            const analytics = await this.analyticsService.getUserAnalytics(userId, 30);
            const recommendedFrequency = this.calculateOptimalFrequency(analytics);
            const optimization = {
                bestTimes,
                bestDays,
                recommendedFrequency,
                timezone: user.timezone || 'America/Chicago',
            };
            if (JSON.stringify(bestTimes) !== JSON.stringify(user.postingTimes)) {
                await this.userModel.updatePostingSettings(userId, {
                    postingTimes: bestTimes,
                });
                logger_1.logger.info(`Updated posting times for user ${userId}: ${bestTimes.join(', ')}`);
            }
            return optimization;
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize posting times:', error);
            return {
                bestTimes: ['09:00', '13:00', '18:00'],
                bestDays: [1, 2, 3, 4, 5, 6, 7],
                recommendedFrequency: 3,
                timezone: 'America/Chicago',
            };
        }
    }
    calculateOptimalFrequency(analytics) {
        const { totalPosts, averageEngagementRate } = analytics;
        if (averageEngagementRate > 5) {
            return 4;
        }
        else if (averageEngagementRate > 2) {
            return 3;
        }
        else {
            return 2;
        }
    }
    async getScheduleStatus(userId) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const scheduledPosts = await this.postModel.findByUser(userId, {
                status: 'scheduled',
                limit: 10,
            });
            const nextExecution = this.calculateNextExecution({
                userId,
                enabled: user.autoPostingEnabled || false,
                times: user.postingTimes || ['09:00', '13:00', '18:00'],
                days: [1, 2, 3, 4, 5, 6, 7],
                postsPerDay: 3,
                categoryRotation: ['real-estate', 'cartoon'],
                timezone: user.timezone || 'America/Chicago',
                testMode: user.testMode || false,
            });
            return {
                enabled: user.autoPostingEnabled || false,
                testMode: user.testMode || false,
                postingTimes: user.postingTimes || ['09:00', '13:00', '18:00'],
                timezone: user.timezone || 'America/Chicago',
                scheduledPosts: scheduledPosts.length,
                nextExecution,
                lastOptimization: user.lastOptimization || null,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get schedule status:', error);
            throw error;
        }
    }
    async pauseScheduling(userId) {
        try {
            await this.userModel.updatePostingSettings(userId, {
                autoPostingEnabled: false,
            });
            logger_1.logger.info(`Paused scheduling for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to pause scheduling:', error);
            throw error;
        }
    }
    async resumeScheduling(userId) {
        try {
            await this.userModel.updatePostingSettings(userId, {
                autoPostingEnabled: true,
            });
            logger_1.logger.info(`Resumed scheduling for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to resume scheduling:', error);
            throw error;
        }
    }
    async updateScheduleConfig(userId, config) {
        try {
            const updateData = {};
            if (config.times) {
                updateData.postingTimes = config.times;
            }
            if (config.timezone) {
                updateData.timezone = config.timezone;
            }
            if (config.testMode !== undefined) {
                updateData.testMode = config.testMode;
            }
            if (config.enabled !== undefined) {
                updateData.autoPostingEnabled = config.enabled;
            }
            await this.userModel.updatePostingSettings(userId, updateData);
            logger_1.logger.info(`Updated schedule config for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update schedule config:', error);
            throw error;
        }
    }
    calculateNextExecution(config) {
        const now = new Date();
        const nextTime = config.times[0] || '09:00';
        const [hours, minutes] = nextTime.split(':').map(Number);
        const nextExecution = new Date(now);
        nextExecution.setHours(hours, minutes, 0, 0);
        if (nextExecution <= now) {
            nextExecution.setDate(nextExecution.getDate() + 1);
        }
        return nextExecution;
    }
    calculateNextExecutionTime() {
        const now = new Date();
        const nextExecution = new Date(now);
        nextExecution.setHours(9, 0, 0, 0);
        if (nextExecution <= now) {
            nextExecution.setDate(nextExecution.getDate() + 1);
        }
        return nextExecution;
    }
    async getSchedulerStats() {
        try {
            const users = await this.userModel.findAll();
            const enabledUsers = users.filter(user => user.autoPostingEnabled);
            const scheduledPosts = await this.postModel.findByStatus('scheduled');
            const postedToday = await this.postModel.findByStatus('posted', {
                postedTime: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            });
            return {
                totalUsers: users.length,
                enabledUsers: enabledUsers.length,
                scheduledPosts: scheduledPosts.length,
                postedToday: postedToday.length,
                nextExecution: this.calculateNextExecutionTime(),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get scheduler stats:', error);
            throw error;
        }
    }
    async cleanupOldScheduledPosts(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const oldPosts = await this.postModel.findByStatus('scheduled', {
                scheduledTime: { $lt: cutoffDate },
            });
            let deletedCount = 0;
            for (const post of oldPosts) {
                try {
                    await this.postModel.delete(post.id);
                    deletedCount++;
                }
                catch (error) {
                    logger_1.logger.error(`Failed to delete old scheduled post ${post.id}:`, error);
                }
            }
            logger_1.logger.info(`Cleaned up ${deletedCount} old scheduled posts`);
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old scheduled posts:', error);
            throw error;
        }
    }
}
exports.SchedulerService = SchedulerService;
exports.default = SchedulerService;
//# sourceMappingURL=schedulerService.js.map