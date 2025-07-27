import mongoose, { Schema, Document } from 'mongoose';

export interface IRepostQueue extends Document {
  sourceMediaId: string; // Original Instagram media ID
  targetPlatform: 'youtube' | 'instagram';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number; // 1-50 based on performance
  scheduledFor: Date;
  queuedAt: Date;
  processedAt?: Date;
  repostVideoId?: string; // VideoStatus ID of the reposted content
  originalContent: {
    caption: string;
    hashtags: string[];
    performanceScore: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    media_url: string;
    permalink: string;
  };
  repostContent?: {
    newCaption: string;
    newHashtags: string[];
    audioTrackId?: string;
    optimizedForPlatform: 'youtube' | 'instagram';
  };
  errorMessage?: string;
  retryCount: number;
}

const RepostQueueSchema = new Schema<IRepostQueue>({
  sourceMediaId: { type: String, required: true },
  targetPlatform: { type: String, enum: ['youtube', 'instagram'], required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'], default: 'queued' },
  priority: { type: Number, required: true, min: 1, max: 50 },
  scheduledFor: { type: Date, required: true },
  queuedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  repostVideoId: { type: String },
  originalContent: {
    caption: { type: String, required: true },
    hashtags: [{ type: String }],
    performanceScore: { type: Number, required: true },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    media_url: { type: String, required: true },
    permalink: { type: String, required: true }
  },
  repostContent: {
    newCaption: { type: String },
    newHashtags: [{ type: String }],
    audioTrackId: { type: String },
    optimizedForPlatform: { type: String, enum: ['youtube', 'instagram'] }
  },
  errorMessage: { type: String },
  retryCount: { type: Number, default: 0 }
});

// Add indexes for efficient queries
RepostQueueSchema.index({ status: 1, scheduledFor: 1 });
RepostQueueSchema.index({ priority: 1 });
RepostQueueSchema.index({ targetPlatform: 1, status: 1 });
RepostQueueSchema.index({ queuedAt: -1 });

// Compound index for unique queued items per platform
RepostQueueSchema.index({ sourceMediaId: 1, targetPlatform: 1 }, { unique: true });

export const RepostQueue = mongoose.model<IRepostQueue>('RepostQueue', RepostQueueSchema); 