import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoStatus extends Document {
  videoId: string;
  uploadDate: Date;
  platform: 'youtube' | 'instagram';
  captionGenerated: boolean;
  posted: boolean;
  lastPosted?: Date;
  fingerprintHash: string; // Required field as specified in user requirements
  fingerprint: {
    hash: string;
    size: number;
    duration?: number;
    sha256Hash?: string; // Enhanced SHA256 hash for Phase 1
    perceptualHash?: string; // Perceptual hash for content similarity
    contentSignature?: string; // Additional content signature
  };
  filename: string;
  filePath?: string;
  status: 'pending' | 'processing' | 'ready' | 'posted' | 'failed';
  errorMessage?: string;
  repostData?: {
    originalVideoId: string;
    originalCaption: string;
    newCaption: string;
    isRepost: boolean;
  };
  phase8Status?: 'not_processed' | 'processing' | 'completed' | 'failed';
  phase8ProcessedAt?: Date;
  phase8Platform?: 'youtube' | 'instagram';
  phase8PolishedTitle?: string;
  phase8PolishedDescription?: string;
  phase8Hashtags?: string[];
  phase8AudioTrackId?: string;
  phase8ProcessedVideoPath?: string;
  // Phase 9: Intelligent Content Repurposing
  phase9Status?: 'source_video' | 'repost_candidate' | 'reposted' | 'excluded';
  phase9SourceMediaId?: string; // Original IG media ID for reposts
  phase9PerformanceScore?: number;
  phase9RepostPlatforms?: ('youtube' | 'instagram')[];
  phase9RepostedAt?: Date;
  phase9ContentType?: 'original' | 'repurposed_from_ig';
  phase9OriginalUrl?: string; // Original Instagram URL
  phase9RepostCount?: number; // How many times this content has been reposted
}

const VideoStatusSchema = new Schema<IVideoStatus>({
  videoId: { type: String, required: true, unique: true },
  uploadDate: { type: Date, default: Date.now },
  platform: { type: String, enum: ['youtube', 'instagram'], required: true },
  captionGenerated: { type: Boolean, default: false },
  posted: { type: Boolean, default: false },
  lastPosted: { type: Date },
  fingerprintHash: { type: String, required: true }, // Required field as specified
  fingerprint: {
    hash: { type: String, required: true },
    size: { type: Number, required: true },
    duration: { type: Number },
    sha256Hash: { type: String }, // Enhanced SHA256 hash for Phase 1
    perceptualHash: { type: String }, // Perceptual hash for content similarity
    contentSignature: { type: String } // Additional content signature
  },
  filename: { type: String, required: true },
  filePath: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'ready', 'posted', 'failed'], default: 'pending' },
  errorMessage: { type: String },
  repostData: {
    originalVideoId: { type: String },
    originalCaption: { type: String },
    newCaption: { type: String },
    isRepost: { type: Boolean, default: false }
  },
  phase8Status: { type: String, enum: ['not_processed', 'processing', 'completed', 'failed'], default: 'not_processed' },
  phase8ProcessedAt: { type: Date },
  phase8Platform: { type: String, enum: ['youtube', 'instagram'] },
  phase8PolishedTitle: { type: String },
  phase8PolishedDescription: { type: String },
  phase8Hashtags: [{ type: String }],
  phase8AudioTrackId: { type: String },
  phase8ProcessedVideoPath: { type: String },
  // Phase 9: Intelligent Content Repurposing
  phase9Status: { type: String, enum: ['source_video', 'repost_candidate', 'reposted', 'excluded'], default: 'source_video' },
  phase9SourceMediaId: { type: String }, // Original IG media ID for reposts
  phase9PerformanceScore: { type: Number },
  phase9RepostPlatforms: [{ type: String, enum: ['youtube', 'instagram'] }],
  phase9RepostedAt: { type: Date },
  phase9ContentType: { type: String, enum: ['original', 'repurposed_from_ig'], default: 'original' },
  phase9OriginalUrl: { type: String }, // Original Instagram URL
  phase9RepostCount: { type: Number, default: 0 } // How many times this content has been reposted
});

// Add indexes for efficient queries - Enhanced for Phase 1
VideoStatusSchema.index({ fingerprintHash: 1 }); // Index for new required field
VideoStatusSchema.index({ 'fingerprint.hash': 1 });
VideoStatusSchema.index({ platform: 1, posted: 1 });
VideoStatusSchema.index({ uploadDate: -1 });
VideoStatusSchema.index({ lastPosted: -1 }); // For repost cooldown queries
VideoStatusSchema.index({ platform: 1, lastPosted: -1 }); // Combined index for platform-specific repost queries

export const VideoStatus = mongoose.model<IVideoStatus>('VideoStatus', VideoStatusSchema); 