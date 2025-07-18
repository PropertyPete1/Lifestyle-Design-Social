import mongoose, { Schema, Document } from 'mongoose';

export interface ITrendingHashtag extends Document {
  hashtag: string;
  platform: 'instagram' | 'tiktok' | 'twitter';
  trendingScore: number;
  category: string;
  fetchedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trendingHashtagSchema = new Schema<ITrendingHashtag>(
  {
    hashtag: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ['instagram', 'tiktok', 'twitter'],
      required: true,
    },
    trendingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: true,
    },
    fetchedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
trendingHashtagSchema.index({ hashtag: 1, platform: 1 }, { unique: true });
trendingHashtagSchema.index({ expiresAt: 1 });
trendingHashtagSchema.index({ trendingScore: -1 });
trendingHashtagSchema.index({ platform: 1, trendingScore: -1 });

export const TrendingHashtag = mongoose.model<ITrendingHashtag>(
  'TrendingHashtag',
  trendingHashtagSchema
);
