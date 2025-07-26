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
exports.VideoQueue = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VideoQueueSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['real_estate', 'cartoon'], required: true },
    dropboxUrl: { type: String, required: true },
    filename: { type: String, required: true },
    status: { type: String, enum: ['pending', 'scheduled', 'posted', 'failed'], default: 'pending' },
    uploadedAt: { type: Date, default: Date.now },
    postedAt: { type: Date },
    datePosted: { type: Date },
    caption: { type: String },
    hashtags: [{ type: String }],
    instagramPostId: { type: String },
    duplicateOf: { type: mongoose_1.Schema.Types.ObjectId, ref: 'VideoQueue' },
    // Boost Caption fields
    captionVersion: { type: String, enum: ['A', 'B', 'C'] },
    selectedTitle: { type: String },
    selectedDescription: { type: String },
    selectedTags: [{ type: String }],
    score: { type: Number, min: 0, max: 100 },
    // YouTube publishing fields
    youtubeVideoId: { type: String },
    publishedTitle: { type: String },
    publishedDescription: { type: String },
    publishedTags: [{ type: String }],
    audioTrackId: { type: String },
    errorMessage: { type: String },
    filePath: { type: String },
    // Video fingerprinting for repost detection
    videoHash: { type: String },
    videoDuration: { type: Number },
    videoSize: { type: Number },
    lastPostedAt: { type: Date },
    // Repost functionality fields
    isRepost: { type: Boolean, default: false },
    originalVideoId: { type: String },
    platform: { type: String, enum: ['youtube', 'instagram'] }
});
// Add scheduledTime field after schema creation
VideoQueueSchema.add({
    scheduledTime: { type: Date, required: false }
});
// Clear existing model to ensure schema updates are applied
if (mongoose_1.default.models.VideoQueue) {
    delete mongoose_1.default.models.VideoQueue;
}
exports.VideoQueue = mongoose_1.default.model('VideoQueue', VideoQueueSchema);
