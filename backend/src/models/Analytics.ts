import mongoose from 'mongoose'

const AnalyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, enum: ['instagram', 'tiktok', 'youtube'], required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    postedAt: { type: Date, required: true },
  },
  { timestamps: true }
)

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema) 