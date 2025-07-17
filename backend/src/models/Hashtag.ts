import mongoose, { Schema, Document } from 'mongoose';

export interface IHashtag extends Document {
  userId?: string;
  hashtag: string;
  category: 'real_estate' | 'viral' | 'trending' | 'custom';
  platform: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'twitter';
  performance: {
    totalUses: number;
    averageEngagement: number;
    averageLikes: number;
    averageComments: number;
    averageShares: number;
    averageReach: number;
    lastUsed: Date;
    bestPerformingPost?: string; // Post ID reference
  };
  trendingData?: {
    trendingScore: number;
    popularity: number;
    growthRate: number;
    fetchedAt: Date;
    expiresAt: Date;
  };
  isGlobal: boolean; // Global trending vs user-specific
  isActive: boolean;
  tags: string[];
  relatedHashtags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const hashtagSchema = new Schema<IHashtag>({
  userId: {
    type: String,
    ref: 'User'
  },
  hashtag: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^#[a-zA-Z0-9_]+$/.test(v);
      },
      message: 'Hashtag must start with # and contain only letters, numbers, and underscores'
    }
  },
  category: {
    type: String,
    enum: ['real_estate', 'viral', 'trending', 'custom'],
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'tiktok', 'facebook', 'youtube', 'twitter'],
    required: true
  },
  performance: {
    totalUses: {
      type: Number,
      default: 0
    },
    averageEngagement: {
      type: Number,
      default: 0
    },
    averageLikes: {
      type: Number,
      default: 0
    },
    averageComments: {
      type: Number,
      default: 0
    },
    averageShares: {
      type: Number,
      default: 0
    },
    averageReach: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    bestPerformingPost: {
      type: String,
      ref: 'Post'
    }
  },
  trendingData: {
    trendingScore: {
      type: Number,
      min: 0,
      max: 100
    },
    popularity: {
      type: Number,
      min: 0,
      max: 100
    },
    growthRate: {
      type: Number
    },
    fetchedAt: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  relatedHashtags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Create indexes
hashtagSchema.index({ hashtag: 1, platform: 1 }, { unique: true });
hashtagSchema.index({ userId: 1, category: 1 });
hashtagSchema.index({ category: 1, platform: 1 });
hashtagSchema.index({ 'performance.averageEngagement': -1 });
hashtagSchema.index({ 'trendingData.trendingScore': -1 });
hashtagSchema.index({ 'trendingData.expiresAt': 1 });
hashtagSchema.index({ isGlobal: 1, isActive: 1 });

export const Hashtag = mongoose.model<IHashtag>('Hashtag', hashtagSchema);

// Export model alias for service compatibility
export const HashtagModel = Hashtag; 