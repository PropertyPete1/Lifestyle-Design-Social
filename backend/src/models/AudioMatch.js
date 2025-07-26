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
exports.AudioMatch = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AudioMatchSchema = new mongoose_1.Schema({
    videoId: {
        type: String,
        required: true,
        index: true
    },
    matchedAudio: {
        type: String,
        required: true
    },
    matchedAt: {
        type: Date,
        default: Date.now
    },
    platform: {
        type: String,
        enum: ['youtube', 'instagram'],
        required: true
    },
    audioMetadata: {
        title: { type: String, required: true },
        artist: { type: String },
        duration: { type: Number },
        trending_rank: { type: Number },
        platform_audio_id: { type: String, required: true },
        category: { type: String }
    },
    matchingFactors: {
        topicMatch: { type: Number, min: 0, max: 100 },
        keywordMatch: { type: Number, min: 0, max: 100 },
        categoryMatch: { type: Number, min: 0, max: 100 },
        overallScore: { type: Number, min: 0, max: 100 }
    },
    status: {
        type: String,
        enum: ['matched', 'applied', 'failed'],
        default: 'matched'
    },
    errorMessage: { type: String }
});
// Add indexes for efficient queries
AudioMatchSchema.index({ videoId: 1, platform: 1 });
AudioMatchSchema.index({ matchedAt: -1 });
AudioMatchSchema.index({ status: 1 });
AudioMatchSchema.index({ 'matchingFactors.overallScore': -1 });
exports.AudioMatch = mongoose_1.default.model('AudioMatch', AudioMatchSchema);
