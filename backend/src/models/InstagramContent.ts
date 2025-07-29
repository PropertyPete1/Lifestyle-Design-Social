import mongoose, { Schema, Document } from 'mongoose';

export interface IInstagramArchive extends Document {
  videoId: string; // Changed from igMediaId for clarity
  caption: string;
  hashtags: string[];
  audioId: string; // Audio track identifier from Instagram
  publishDate: Date; // Changed from timestamp
  viewCount: number;
  likeCount: number;
  commentCount: number;
  performanceScore: number; // views + likes*2 + comments*3
  originalPostDate: Date; // When originally posted on Instagram
  repostEligible: boolean; // Eligible for reposting
  reposted: boolean; // Has been reposted
  media_url: string;
  permalink: string;
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  scrapedAt: Date;
  repostPriority: number; // 1-50 ranking
  lastRepostDate?: Date; // Track when it was last reposted
  repostCount: number; // How many times reposted
  dropboxSynced: boolean; // Whether synced to Dropbox
  dropboxPath?: string; // Path in Dropbox if synced
}

const InstagramArchiveSchema = new Schema<IInstagramArchive>({
  videoId: { type: String, required: true, unique: true },
  caption: { type: String, required: true },
  hashtags: [{ type: String }],
  audioId: { type: String, default: '' },
  publishDate: { type: Date, required: true },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  performanceScore: { type: Number, required: true },
  originalPostDate: { type: Date, required: true },
  repostEligible: { type: Boolean, default: false },
  reposted: { type: Boolean, default: false },
  media_url: { type: String, required: true },
  permalink: { type: String, required: true },
  mediaType: { type: String, enum: ['VIDEO', 'IMAGE', 'CAROUSEL_ALBUM'], required: true },
  scrapedAt: { type: Date, default: Date.now },
  repostPriority: { type: Number, default: 0 },
  lastRepostDate: { type: Date },
  repostCount: { type: Number, default: 0 },
  dropboxSynced: { type: Boolean, default: false },
  dropboxPath: { type: String }
});

// Optimized indexes for Phase 9 operations
InstagramArchiveSchema.index({ performanceScore: -1 });
InstagramArchiveSchema.index({ repostEligible: 1, reposted: 1 });
InstagramArchiveSchema.index({ originalPostDate: -1 });
InstagramArchiveSchema.index({ scrapedAt: -1 });
InstagramArchiveSchema.index({ repostPriority: 1 });
InstagramArchiveSchema.index({ lastRepostDate: -1 });

// Virtual for age calculation
InstagramArchiveSchema.virtual('daysSincePost').get(function() {
  return Math.floor((Date.now() - this.originalPostDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Calculate performance score before saving
InstagramArchiveSchema.pre('save', function() {
  this.performanceScore = this.viewCount + (this.likeCount * 2) + (this.commentCount * 3);
});

export const InstagramArchive = mongoose.model<IInstagramArchive>('InstagramArchive', InstagramArchiveSchema);

// Legacy export for compatibility
export const InstagramContent = InstagramArchive; 