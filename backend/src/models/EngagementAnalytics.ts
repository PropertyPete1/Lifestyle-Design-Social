import mongoose, { Schema, Document } from 'mongoose';

export interface IEngagementAnalytics extends Document {
  platform: string;
  hour: number;
  date: Date;
  engagementScore: number;
  postCount: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgViews?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EngagementAnalyticsSchema = new Schema<IEngagementAnalytics>({
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'tiktok', 'youtube']
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  date: {
    type: Date,
    required: true
  },
  engagementScore: {
    type: Number,
    required: true,
    default: 0
  },
  postCount: {
    type: Number,
    required: true,
    default: 1
  },
  avgLikes: {
    type: Number,
    required: true,
    default: 0
  },
  avgComments: {
    type: Number,
    required: true,
    default: 0
  },
  avgShares: {
    type: Number,
    required: true,
    default: 0
  },
  avgViews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
EngagementAnalyticsSchema.index({ platform: 1, date: 1, hour: 1 }, { unique: true });
EngagementAnalyticsSchema.index({ platform: 1, date: 1 });
EngagementAnalyticsSchema.index({ date: 1 });

export const EngagementAnalyticsModel = mongoose.model<IEngagementAnalytics>('EngagementAnalytics', EngagementAnalyticsSchema); 