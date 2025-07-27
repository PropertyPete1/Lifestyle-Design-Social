import mongoose, { Schema, Document } from 'mongoose';

export interface IInstagramContent extends Document {
  igMediaId: string;
  caption: string;
  media_url: string;
  timestamp: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  hashtags: string[];
  performanceScore: number; // Calculated score: views + likes * 1.5 + comments * 2
  scrapedAt: Date;
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  permalink: string;
  isEligibleForRepost: boolean;
  repostPriority: number; // 1-50 ranking for top performers
}

const InstagramContentSchema = new Schema<IInstagramContent>({
  igMediaId: { type: String, required: true, unique: true },
  caption: { type: String, required: true },
  media_url: { type: String, required: true },
  timestamp: { type: Date, required: true },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  hashtags: [{ type: String }],
  performanceScore: { type: Number, required: true },
  scrapedAt: { type: Date, default: Date.now },
  mediaType: { type: String, enum: ['VIDEO', 'IMAGE', 'CAROUSEL_ALBUM'], required: true },
  permalink: { type: String, required: true },
  isEligibleForRepost: { type: Boolean, default: false },
  repostPriority: { type: Number, default: 0 }
});

// Add indexes for efficient queries
InstagramContentSchema.index({ performanceScore: -1 });
InstagramContentSchema.index({ scrapedAt: -1 });
InstagramContentSchema.index({ isEligibleForRepost: 1 });
InstagramContentSchema.index({ repostPriority: 1 });

export const InstagramContent = mongoose.model<IInstagramContent>('InstagramContent', InstagramContentSchema); 