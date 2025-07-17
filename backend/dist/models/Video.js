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
exports.VideoModel = exports.Video = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const videoSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    filename: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    duration: Number,
    resolution: String,
    thumbnailPath: String,
    hasAudio: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        enum: ['real-estate', 'cartoon'],
        required: true
    },
    propertyType: String,
    location: String,
    price: Number,
    tags: [String],
    aiScore: Number,
    postCount: {
        type: Number,
        default: 0
    },
    lastPostedAt: Date,
    nextPostDate: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    preferredCaption: String,
    preferredHashtags: [String],
    preferredMusic: String,
    coolOffDays: {
        type: Number,
        default: 30
    },
    starred: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
videoSchema.index({ userId: 1 });
videoSchema.index({ category: 1 });
videoSchema.index({ isActive: 1 });
videoSchema.index({ starred: 1 });
videoSchema.index({ nextPostDate: 1 });
exports.Video = mongoose_1.default.model('Video', videoSchema);
exports.VideoModel = exports.Video;
//# sourceMappingURL=Video.js.map