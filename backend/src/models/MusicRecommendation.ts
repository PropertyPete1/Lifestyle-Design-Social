import mongoose, { Schema, Document } from 'mongoose';

export interface IMusicRecommendation extends Document {
  userId: string;
  videoId: string;
  trackId: string;
  trackName: string;
  artistName: string;
  album?: string;
  genre: string;
  mood: string;
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  popularity: number;
  trendingScore: number;
  platform: 'spotify' | 'tiktok' | 'youtube' | 'soundcloud' | 'custom';
  previewUrl?: string;
  externalUrl?: string;
  duration: number;
  isExplicit: boolean;
  tags: string[];
  matchData: {
    matchScore: number;
    matchReason: string;
    videoMood: string;
    contentType: 'real_estate' | 'cartoon';
    platformOptimized: string[];
    audioDuration: number;
    audioTempo?: number;
    audioEnergy?: number;
  };
  recommendationSource: 'ai_analysis' | 'trending' | 'user_preference' | 'similar_videos';
  isUsed: boolean;
  usedAt?: Date;
  performance?: {
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const musicRecommendationSchema = new Schema<IMusicRecommendation>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  videoId: {
    type: String,
    required: true,
    ref: 'Video'
  },
  trackId: {
    type: String,
    required: true
  },
  trackName: {
    type: String,
    required: true,
    trim: true
  },
  artistName: {
    type: String,
    required: true,
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  mood: {
    type: String,
    required: true,
    trim: true
  },
  tempo: {
    type: Number,
    required: true,
    min: 0,
    max: 300
  },
  energy: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  danceability: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  valence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  popularity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  trendingScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  platform: {
    type: String,
    enum: ['spotify', 'tiktok', 'youtube', 'soundcloud', 'custom'],
    required: true
  },
  previewUrl: {
    type: String,
    trim: true
  },
  externalUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  isExplicit: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  matchData: {
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    matchReason: {
      type: String,
      required: true,
      trim: true
    },
    videoMood: {
      type: String,
      required: true,
      trim: true
    },
    contentType: {
      type: String,
      enum: ['real_estate', 'cartoon'],
      required: true
    },
    platformOptimized: [{
      type: String,
      enum: ['instagram', 'tiktok', 'facebook', 'youtube']
    }],
    audioDuration: {
      type: Number,
      required: true
    },
    audioTempo: {
      type: Number,
      min: 0,
      max: 300
    },
    audioEnergy: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  recommendationSource: {
    type: String,
    enum: ['ai_analysis', 'trending', 'user_preference', 'similar_videos'],
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  performance: {
    engagement: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Create indexes
musicRecommendationSchema.index({ userId: 1, videoId: 1 });
musicRecommendationSchema.index({ videoId: 1, 'matchData.matchScore': -1 });
musicRecommendationSchema.index({ userId: 1, recommendationSource: 1 });
musicRecommendationSchema.index({ expiresAt: 1 });
musicRecommendationSchema.index({ platform: 1, trendingScore: -1 });
musicRecommendationSchema.index({ genre: 1, mood: 1 });
musicRecommendationSchema.index({ isUsed: 1, usedAt: -1 });

export const MusicRecommendation = mongoose.model<IMusicRecommendation>('MusicRecommendation', musicRecommendationSchema);

// Export model alias for service compatibility
export const MusicRecommendationsModel = MusicRecommendation; 