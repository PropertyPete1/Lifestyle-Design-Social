import mongoose, { Schema, Document } from 'mongoose';

export interface IHashtagPerformance extends Document {
  userId: string;
  hashtag: string;
  totalUses: number;
  totalEngagement: number;
  averageEngagement: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const hashtagPerformanceSchema = new Schema<IHashtagPerformance>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    hashtag: {
      type: String,
      required: true,
    },
    totalUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEngagement: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageEngagement: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
hashtagPerformanceSchema.index({ userId: 1, hashtag: 1 }, { unique: true });
hashtagPerformanceSchema.index({ userId: 1, averageEngagement: -1 });
hashtagPerformanceSchema.index({ userId: 1, lastUsed: -1 });

export const HashtagPerformance = mongoose.model<IHashtagPerformance>(
  'HashtagPerformance',
  hashtagPerformanceSchema
);
