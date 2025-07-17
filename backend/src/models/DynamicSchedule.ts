import mongoose, { Schema, Document } from 'mongoose';

export interface IOptimalTime {
  hour: number;
  minute: number;
  engagement_score: number;
  confidence: number;
}

export interface IDynamicSchedule extends Document {
  instagramTimes: IOptimalTime[];
  tiktokTimes: IOptimalTime[];
  youtubeTimes: IOptimalTime[];
  confidenceScore: number;
  dataPoints: number;
  lastEngagementUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OptimalTimeSchema = new Schema<IOptimalTime>({
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 59
  },
  engagement_score: {
    type: Number,
    required: true,
    default: 0
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  }
}, { _id: false });

const DynamicScheduleSchema = new Schema<IDynamicSchedule>({
  instagramTimes: {
    type: [OptimalTimeSchema],
    required: true,
    default: []
  },
  tiktokTimes: {
    type: [OptimalTimeSchema],
    required: true,
    default: []
  },
  youtubeTimes: {
    type: [OptimalTimeSchema],
    required: true,
    default: []
  },
  confidenceScore: {
    type: Number,
    required: true,
    default: 50,
    min: 0,
    max: 100
  },
  dataPoints: {
    type: Number,
    required: true,
    default: 0
  },
  lastEngagementUpdate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries (most recent first)
DynamicScheduleSchema.index({ updatedAt: -1 });

export const DynamicScheduleModel = mongoose.model<IDynamicSchedule>('DynamicSchedule', DynamicScheduleSchema); 