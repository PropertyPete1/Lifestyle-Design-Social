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
exports.schedulePostJob = schedulePostJob;
exports.cancelScheduledPost = cancelScheduledPost;
exports.initializeScheduledJobs = initializeScheduledJobs;
const cron = __importStar(require("node-cron"));
const publishVideo_1 = require("./publishVideo");
const videoQueue_1 = require("../../services/videoQueue");
// Store active cron jobs
const scheduledJobs = new Map();
async function schedulePostJob({ videoId, scheduledTime, title, description, tags, audioTrackId }) {
    try {
        // Validate scheduled time is in the future
        if (scheduledTime <= new Date()) {
            throw new Error('Scheduled time must be in the future');
        }
        // Update video status to scheduled in MongoDB
        await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, {
            status: 'scheduled',
            scheduledTime: scheduledTime,
            selectedTitle: title,
            selectedDescription: description,
            selectedTags: tags,
            audioTrackId: audioTrackId
        });
        // Convert scheduled time to cron format
        const cronTime = convertDateToCron(scheduledTime);
        // Create cron job
        const job = cron.schedule(cronTime, async () => {
            console.log(`🕒 Executing scheduled post for video: ${videoId}`);
            try {
                const result = await (0, publishVideo_1.publishVideo)({
                    videoId,
                    title,
                    description,
                    tags,
                    audioTrackId
                });
                if (result.success) {
                    console.log(`✅ Scheduled video posted successfully: ${result.youtubeVideoId}`);
                }
                else {
                    console.error(`❌ Failed to post scheduled video: ${result.error}`);
                }
            }
            catch (error) {
                console.error(`❌ Error in scheduled job for video ${videoId}:`, error);
                // Update video status to failed
                await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, {
                    status: 'failed',
                    errorMessage: error instanceof Error ? error.message : 'Scheduled job failed'
                });
            }
            // Remove job from memory after execution
            scheduledJobs.delete(videoId);
        }, {
            timezone: 'America/New_York' // Adjust to your timezone
        });
        // Store job reference
        scheduledJobs.set(videoId, job);
        // Start the job
        job.start();
        console.log(`🕒 Video scheduled for posting at ${scheduledTime.toISOString()}`);
        return { success: true };
    }
    catch (error) {
        console.error('❌ Failed to schedule video:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function cancelScheduledPost(videoId) {
    try {
        const job = scheduledJobs.get(videoId);
        if (job) {
            job.destroy();
            scheduledJobs.delete(videoId);
        }
        // Update video status back to pending
        await videoQueue_1.VideoQueue.findByIdAndUpdate(videoId, {
            status: 'pending',
            scheduledTime: undefined
        });
        console.log(`🚫 Cancelled scheduled post for video: ${videoId}`);
        return { success: true };
    }
    catch (error) {
        console.error('❌ Failed to cancel scheduled video:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
// Helper function to convert Date to cron format
function convertDateToCron(date) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed
    const year = date.getFullYear();
    // Format: minute hour day month *
    return `${minutes} ${hours} ${day} ${month} *`;
}
// Function to initialize any existing scheduled jobs on server restart
async function initializeScheduledJobs() {
    try {
        const scheduledVideos = await videoQueue_1.VideoQueue.find({
            status: 'scheduled',
            scheduledTime: { $gt: new Date() } // Only future scheduled posts
        });
        for (const video of scheduledVideos) {
            if (video.scheduledTime && video.selectedTitle && video.selectedDescription) {
                await schedulePostJob({
                    videoId: video._id.toString(),
                    scheduledTime: video.scheduledTime,
                    title: video.selectedTitle,
                    description: video.selectedDescription,
                    tags: video.selectedTags || [],
                    audioTrackId: video.audioTrackId
                });
            }
        }
        console.log(`🕒 Initialized ${scheduledVideos.length} scheduled jobs`);
    }
    catch (error) {
        console.error('❌ Failed to initialize scheduled jobs:', error);
    }
}
