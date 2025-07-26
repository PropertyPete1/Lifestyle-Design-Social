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
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioMatchingScheduler = exports.AudioMatchingScheduler = void 0;
const cron = __importStar(require("node-cron"));
const audioMatchingService_1 = require("./audioMatchingService");
class AudioMatchingScheduler {
    constructor() {
        this.matchingJob = null;
        this.audioMatchingService = new audioMatchingService_1.AudioMatchingService();
    }
    /**
     * Start the scheduled audio matching job
     * Runs every 2 hours to match videos with fresh trending audio
     */
    start() {
        if (this.matchingJob) {
            console.log('🎵 Audio matching scheduler already running');
            return;
        }
        // Schedule job to run every 2 hours
        this.matchingJob = cron.schedule('0 */2 * * *', async () => {
            console.log('🎵 Starting scheduled audio matching...');
            try {
                const matches = await this.audioMatchingService.matchAllPendingVideos();
                console.log(`✅ Scheduled audio matching completed: ${matches.length} videos matched`);
            }
            catch (error) {
                console.error('❌ Error in scheduled audio matching:', error);
            }
        });
        this.matchingJob.start();
        console.log('🎵 Audio matching scheduler started - running every 2 hours');
    }
    /**
     * Stop the scheduled audio matching job
     */
    stop() {
        if (this.matchingJob) {
            this.matchingJob.stop();
            this.matchingJob = null;
            console.log('🎵 Audio matching scheduler stopped');
        }
    }
    /**
     * Run audio matching immediately (manual trigger)
     */
    async runNow() {
        console.log('🎵 Running audio matching manually...');
        try {
            const matches = await this.audioMatchingService.matchAllPendingVideos();
            console.log(`✅ Manual audio matching completed: ${matches.length} videos matched`);
        }
        catch (error) {
            console.error('❌ Error in manual audio matching:', error);
            throw error;
        }
    }
    /**
     * Get scheduler status
     */
    getStatus() {
        if (!this.matchingJob) {
            return { running: false };
        }
        const status = this.matchingJob.getStatus();
        return {
            running: status === 'scheduled',
            status: typeof status === 'string' ? status : 'unknown'
        };
    }
}
exports.AudioMatchingScheduler = AudioMatchingScheduler;
// Export singleton instance
exports.audioMatchingScheduler = new AudioMatchingScheduler();
