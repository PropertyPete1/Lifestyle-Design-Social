import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoIntelligence extends Document {
  videoId: string;
  sceneAnalysis: {
    dominantColors: string[];
    brightness: number;
    contrast: number;
    sceneType: 'indoor' | 'outdoor' | 'mixed';
    propertyType: 'house' | 'apartment' | 'commercial' | 'land' | 'unknown';
    hasText: boolean;
    hasFaces: boolean;
    faceCount: number;
    objectsDetected: string[];
    qualityScore: number;
  };
  audioAnalysis: {
    hasAudio: boolean;
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    mood: 'energetic' | 'calm' | 'professional' | 'upbeat' | 'dramatic';
    tempo: number;
    volume: number;
    backgroundNoise: number;
    speechDetected: boolean;
    musicDetected: boolean;
    recommendedMusicGenre: string[];
  };
  thumbnailOptions: Array<{
    timestamp: number;
    imagePath: string;
    score: number;
    reasoning: string;
    faceCount: number;
    textPresent: boolean;
    colorScore: number;
    compositionScore: number;
    engagementPrediction: number;
  }>;
  musicRecommendations: Array<{
    trackId: string;
    trackName: string;
    artist: string;
    genre: string;
    mood: string;
    tempo: number;
    popularity: number;
    trendingScore: number;
    matchScore: number;
    previewUrl?: string;
    platform: 'spotify' | 'tiktok' | 'youtube' | 'custom';
  }>;
  engagementPrediction: {
    overallScore: number;
    factors: {
      thumbnailQuality: number;
      audioQuality: number;
      visualAppeal: number;
      contentRelevance: number;
      trendAlignment: number;
    };
    recommendations: string[];
    expectedViews: number;
    expectedEngagementRate: number;
  };
  optimizationSuggestions: Array<{
    category: 'thumbnail' | 'audio' | 'compression' | 'timing' | 'content';
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'easy' | 'moderate' | 'complex';
    estimatedImprovement: number;
  }>;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const videoIntelligenceSchema = new Schema<IVideoIntelligence>(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
      ref: 'Video',
    },
    sceneAnalysis: {
      dominantColors: [
        {
          type: String,
          required: true,
        },
      ],
      brightness: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      contrast: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      sceneType: {
        type: String,
        enum: ['indoor', 'outdoor', 'mixed'],
        required: true,
      },
      propertyType: {
        type: String,
        enum: ['house', 'apartment', 'commercial', 'land', 'unknown'],
        required: true,
      },
      hasText: {
        type: Boolean,
        required: true,
      },
      hasFaces: {
        type: Boolean,
        required: true,
      },
      faceCount: {
        type: Number,
        required: true,
        min: 0,
      },
      objectsDetected: [String],
      qualityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
    },
    audioAnalysis: {
      hasAudio: {
        type: Boolean,
        required: true,
      },
      audioQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        required: true,
      },
      mood: {
        type: String,
        enum: ['energetic', 'calm', 'professional', 'upbeat', 'dramatic'],
        required: true,
      },
      tempo: {
        type: Number,
        required: true,
        min: 0,
      },
      volume: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      backgroundNoise: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      speechDetected: {
        type: Boolean,
        required: true,
      },
      musicDetected: {
        type: Boolean,
        required: true,
      },
      recommendedMusicGenre: [String],
    },
    thumbnailOptions: [
      {
        timestamp: {
          type: Number,
          required: true,
          min: 0,
        },
        imagePath: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        reasoning: {
          type: String,
          required: true,
        },
        faceCount: {
          type: Number,
          required: true,
          min: 0,
        },
        textPresent: {
          type: Boolean,
          required: true,
        },
        colorScore: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        compositionScore: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        engagementPrediction: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
      },
    ],
    musicRecommendations: [
      {
        trackId: {
          type: String,
          required: true,
        },
        trackName: {
          type: String,
          required: true,
        },
        artist: {
          type: String,
          required: true,
        },
        genre: {
          type: String,
          required: true,
        },
        mood: {
          type: String,
          required: true,
        },
        tempo: {
          type: Number,
          required: true,
          min: 0,
        },
        popularity: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        trendingScore: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        matchScore: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        previewUrl: String,
        platform: {
          type: String,
          enum: ['spotify', 'tiktok', 'youtube', 'custom'],
          required: true,
        },
      },
    ],
    engagementPrediction: {
      overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
      factors: {
        thumbnailQuality: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        audioQuality: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        visualAppeal: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        contentRelevance: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        trendAlignment: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
      },
      recommendations: [String],
      expectedViews: {
        type: Number,
        required: true,
        min: 0,
      },
      expectedEngagementRate: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      },
    },
    optimizationSuggestions: [
      {
        category: {
          type: String,
          enum: ['thumbnail', 'audio', 'compression', 'timing', 'content'],
          required: true,
        },
        suggestion: {
          type: String,
          required: true,
        },
        impact: {
          type: String,
          enum: ['high', 'medium', 'low'],
          required: true,
        },
        effort: {
          type: String,
          enum: ['easy', 'moderate', 'complex'],
          required: true,
        },
        estimatedImprovement: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    analyzedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
videoIntelligenceSchema.index({ videoId: 1 }, { unique: true });
videoIntelligenceSchema.index({ analyzedAt: -1 });
videoIntelligenceSchema.index({ 'engagementPrediction.overallScore': -1 });
videoIntelligenceSchema.index({ 'sceneAnalysis.qualityScore': -1 });

export const VideoIntelligence = mongoose.model<IVideoIntelligence>(
  'VideoIntelligence',
  videoIntelligenceSchema
);
