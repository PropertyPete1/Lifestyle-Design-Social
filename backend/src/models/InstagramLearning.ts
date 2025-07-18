import mongoose, { Schema, Document } from 'mongoose';

export interface IInstagramLearning extends Document {
  userId: string;
  postId: string;
  caption: string;
  hashtags: string[];
  mediaType: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  permalink: string;
  timestamp: Date;
  engagementData: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
  };
  engagementRate: number;
  isHighPerforming: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const instagramLearningSchema = new Schema<IInstagramLearning>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    postId: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      required: true,
    },
    hashtags: [
      {
        type: String,
      },
    ],
    mediaType: {
      type: String,
      enum: ['VIDEO', 'IMAGE', 'CAROUSEL_ALBUM'],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    permalink: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    engagementData: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
    },
    engagementRate: {
      type: Number,
      required: true,
      min: 0,
    },
    isHighPerforming: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
instagramLearningSchema.index({ userId: 1, postId: 1 }, { unique: true });
instagramLearningSchema.index({ userId: 1, isHighPerforming: 1, mediaType: 1, createdAt: -1 });
instagramLearningSchema.index({ userId: 1, engagementRate: -1 });
instagramLearningSchema.index({ userId: 1, timestamp: -1 });

export const InstagramLearning = mongoose.model<IInstagramLearning>(
  'InstagramLearning',
  instagramLearningSchema
);
