import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoQueue extends Document {
  type: 'real_estate' | 'cartoon';
  dropboxUrl: string;
  filename: string;
  status: 'pending' | 'scheduled' | 'posted' | 'failed';
  uploadedAt: Date;
  postedAt?: Date;
  datePosted?: Date;
  caption?: string;
  hashtags?: string[];
  instagramPostId?: string;
  duplicateOf?: mongoose.Types.ObjectId;
  // Boost Caption fields
  captionVersion?: 'A' | 'B' | 'C';
  selectedTitle?: string;
  selectedDescription?: string;
  selectedTags?: string[];
  score?: number;
  // Peak hour scheduling
  scheduledTime?: Date;
  // YouTube publishing fields
  youtubeVideoId?: string;
  publishedTitle?: string;
  publishedDescription?: string;
  publishedTags?: string[];
  audioTrackId?: string;
  errorMessage?: string;
  filePath?: string;
  // Video fingerprinting for repost detection
  videoHash?: string;
  videoDuration?: number;
  videoSize?: number;
  lastPostedAt?: Date;
  // Repost functionality fields
  isRepost?: boolean;
  originalVideoId?: string;
  platform?: 'youtube' | 'instagram';
  // Phase 8: Final Polish fields
  phase8Status?: 'not_processed' | 'processing' | 'completed' | 'failed';
  phase8ProcessedAt?: Date;
  phase8Platform?: 'youtube' | 'instagram';
  phase8ProcessedVideoPath?: string;
}

const VideoQueueSchema = new Schema<IVideoQueue>({
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
  duplicateOf: { type: Schema.Types.ObjectId, ref: 'VideoQueue' },
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
  platform: { type: String, enum: ['youtube', 'instagram'] },
  // Phase 8: Final Polish fields
  phase8Status: { type: String, enum: ['not_processed', 'processing', 'completed', 'failed'], default: 'not_processed' },
  phase8ProcessedAt: { type: Date },
  phase8Platform: { type: String, enum: ['youtube', 'instagram'] },
  phase8ProcessedVideoPath: { type: String }
});

// Add scheduledTime field after schema creation
VideoQueueSchema.add({
  scheduledTime: { type: Date, required: false }
});

// Clear existing model to ensure schema updates are applied
if (mongoose.models.VideoQueue) {
  delete mongoose.models.VideoQueue;
}

export const VideoQueue = mongoose.model<IVideoQueue>('VideoQueue', VideoQueueSchema); 