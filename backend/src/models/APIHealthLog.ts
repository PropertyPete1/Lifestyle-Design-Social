import mongoose, { Schema, Document } from 'mongoose';

export interface IAPIHealthLog extends Document {
  platform: string;
  status: 'healthy' | 'degraded' | 'failed';
  errorMessage?: string;
  responseTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const APIHealthLogSchema = new Schema<IAPIHealthLog>(
  {
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'tiktok', 'youtube'],
    },
    status: {
      type: String,
      required: true,
      enum: ['healthy', 'degraded', 'failed'],
    },
    errorMessage: {
      type: String,
    },
    responseTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
APIHealthLogSchema.index({ platform: 1, createdAt: -1 });
APIHealthLogSchema.index({ createdAt: -1 });

export const APIHealthLogModel = mongoose.model<IAPIHealthLog>('APIHealthLog', APIHealthLogSchema);
