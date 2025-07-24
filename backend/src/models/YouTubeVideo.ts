import mongoose, { Schema, Document } from 'mongoose';

export interface IYouTubeVideo extends Document {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  alreadyPosted: boolean;
  captionVersion?: 'A' | 'B' | 'C';
  score?: number;
  // Audio track matching for YouTube Shorts
  audioTrackId?: string;
  // Video fingerprinting for content-based matching
  videoFingerprint?: {
    contentHash: string;
    fileSize?: number;
    duration?: number;
    aspectRatio?: number;
    signature?: string;
  };
  // Peak hour scheduling for optimal posting times
  scheduledTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const YouTubeVideoSchema: Schema = new Schema({
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

export default mongoose.model<IYouTubeVideo>('YouTubeVideo', YouTubeVideoSchema); 