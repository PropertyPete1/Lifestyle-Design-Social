import mongoose, { Schema, Document } from 'mongoose';

export interface IViralOptimization extends Document {
  videoId: string;
  hooks: Array<{
    id: string;
    type: string;
    text: string;
    timing: number;
    duration: number;
    position: {
      x: number;
      y: number;
      anchor: string;
    };
    style: {
      fontFamily: string;
      fontSize: number;
      color: string;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      shadow: boolean;
      bold: boolean;
      italic: boolean;
    };
    animation: string;
    category: string;
    effectiveness: number;
    platform: string[];
  }>;
  optimizedVideoPath: string;
  originalVideoPath: string;
  processingTime: number;
  effectiveness: number;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const viralOptimizationSchema = new Schema<IViralOptimization>(
  {
    videoId: {
      type: String,
      required: true,
      ref: 'Video',
    },
    hooks: [
      {
        id: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timing: {
          type: Number,
          required: true,
          min: 0,
        },
        duration: {
          type: Number,
          required: true,
          min: 0,
        },
        position: {
          x: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },
          y: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },
          anchor: {
            type: String,
            required: true,
          },
        },
        style: {
          fontFamily: {
            type: String,
            required: true,
          },
          fontSize: {
            type: Number,
            required: true,
            min: 8,
          },
          color: {
            type: String,
            required: true,
          },
          backgroundColor: String,
          borderColor: String,
          borderWidth: Number,
          shadow: {
            type: Boolean,
            required: true,
          },
          bold: {
            type: Boolean,
            required: true,
          },
          italic: {
            type: Boolean,
            required: true,
          },
        },
        animation: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        effectiveness: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        platform: [String],
      },
    ],
    optimizedVideoPath: {
      type: String,
      required: true,
    },
    originalVideoPath: {
      type: String,
      required: true,
    },
    processingTime: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveness: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    recommendations: [String],
  },
  {
    timestamps: true,
  }
);

// Create indexes
viralOptimizationSchema.index({ videoId: 1 });
viralOptimizationSchema.index({ createdAt: -1 });
viralOptimizationSchema.index({ effectiveness: -1 });

export const ViralOptimization = mongoose.model<IViralOptimization>(
  'ViralOptimization',
  viralOptimizationSchema
);

export interface ViralOptimizationCreateInput {
  videoId: string;
  hooks: Array<{
    id: string;
    type: string;
    text: string;
    timing: number;
    duration: number;
    position: {
      x: number;
      y: number;
      anchor: string;
    };
    style: {
      fontFamily: string;
      fontSize: number;
      color: string;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      shadow: boolean;
      bold: boolean;
      italic: boolean;
    };
    animation: string;
    category: string;
    effectiveness: number;
    platform: string[];
  }>;
  optimizedVideoPath: string;
  originalVideoPath: string;
  processingTime: number;
  effectiveness: number;
  recommendations: string[];
}
