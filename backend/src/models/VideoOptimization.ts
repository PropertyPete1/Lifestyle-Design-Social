import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoOptimization extends Document {
  videoId: string;
  optimizationType: 'compression' | 'resolution' | 'bitrate' | 'fps' | 'audio' | 'filters';
  beforeValue: number;
  afterValue: number;
  improvementPercentage: number;
  settings: {
    platform: string;
    contentType: string;
    quality: string;
    targetFileSize?: number;
    maxDuration?: number;
    preserveAudio: boolean;
    enhanceVisuals: boolean;
    optimizeForMobile: boolean;
  };
  compressionResult: {
    originalPath: string;
    compressedPath: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    qualityScore: number;
    processingTime: number;
  };
  optimizations: Array<{
    type: string;
    description: string;
    impact: string;
    sizeSaving: number;
    qualityImpact: number;
  }>;
  warnings: string[];
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const videoOptimizationSchema = new Schema<IVideoOptimization>(
  {
    videoId: {
      type: String,
      required: true,
      ref: 'Video',
    },
    optimizationType: {
      type: String,
      enum: ['compression', 'resolution', 'bitrate', 'fps', 'audio', 'filters'],
      required: true,
    },
    beforeValue: {
      type: Number,
      required: true,
    },
    afterValue: {
      type: Number,
      required: true,
    },
    improvementPercentage: {
      type: Number,
      required: true,
    },
    settings: {
      platform: {
        type: String,
        required: true,
      },
      contentType: {
        type: String,
        required: true,
      },
      quality: {
        type: String,
        required: true,
      },
      targetFileSize: Number,
      maxDuration: Number,
      preserveAudio: {
        type: Boolean,
        required: true,
      },
      enhanceVisuals: {
        type: Boolean,
        required: true,
      },
      optimizeForMobile: {
        type: Boolean,
        required: true,
      },
    },
    compressionResult: {
      originalPath: {
        type: String,
        required: true,
      },
      compressedPath: {
        type: String,
        required: true,
      },
      originalSize: {
        type: Number,
        required: true,
      },
      compressedSize: {
        type: Number,
        required: true,
      },
      compressionRatio: {
        type: Number,
        required: true,
      },
      qualityScore: {
        type: Number,
        required: true,
      },
      processingTime: {
        type: Number,
        required: true,
      },
    },
    optimizations: [
      {
        type: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        impact: {
          type: String,
          required: true,
        },
        sizeSaving: {
          type: Number,
          required: true,
        },
        qualityImpact: {
          type: Number,
          required: true,
        },
      },
    ],
    warnings: [String],
    appliedAt: {
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
videoOptimizationSchema.index({ videoId: 1 });
videoOptimizationSchema.index({ optimizationType: 1 });
videoOptimizationSchema.index({ appliedAt: -1 });
videoOptimizationSchema.index({ videoId: 1, appliedAt: -1 });

export const VideoOptimization = mongoose.model<IVideoOptimization>(
  'VideoOptimization',
  videoOptimizationSchema
);

export interface VideoOptimizationCreateInput {
  videoId: string;
  optimizationType: 'compression' | 'resolution' | 'bitrate' | 'fps' | 'audio' | 'filters';
  beforeValue: number;
  afterValue: number;
  improvementPercentage: number;
  settings: {
    platform: string;
    contentType: string;
    quality: string;
    targetFileSize?: number;
    maxDuration?: number;
    preserveAudio: boolean;
    enhanceVisuals: boolean;
    optimizeForMobile: boolean;
  };
  compressionResult: {
    originalPath: string;
    compressedPath: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    qualityScore: number;
    processingTime: number;
  };
  optimizations: Array<{
    type: string;
    description: string;
    impact: string;
    sizeSaving: number;
    qualityImpact: number;
  }>;
  warnings?: string[];
}
