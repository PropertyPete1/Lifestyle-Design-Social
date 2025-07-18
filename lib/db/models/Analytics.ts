import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema); 