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
const mongoose_1 = __importStar(require("mongoose"));
const YouTubeVideoSchema = new mongoose_1.Schema({
    videoId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    viewCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    publishedAt: {
        type: String,
        required: true
    },
    alreadyPosted: {
        type: Boolean,
        default: false
    },
    captionVersion: {
        type: String,
        enum: ['A', 'B', 'C'],
        required: false
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
        required: false
    },
    selectedTitle: {
        type: String,
        required: false
    },
    selectedDescription: {
        type: String,
        required: false
    },
    audioTrackId: {
        type: String,
        required: false
    },
    videoFingerprint: {
        contentHash: { type: String },
        fileSize: { type: Number },
        duration: { type: Number },
        aspectRatio: { type: Number },
        signature: { type: String }
    },
    scheduledTime: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});
// Create indexes for performance
YouTubeVideoSchema.index({ viewCount: -1 });
YouTubeVideoSchema.index({ publishedAt: -1 });
YouTubeVideoSchema.index({ alreadyPosted: 1 });
exports.default = mongoose_1.default.model('YouTubeVideo', YouTubeVideoSchema);
