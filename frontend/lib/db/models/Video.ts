import mongoose from 'mongoose'

const VideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { type: String, required: true },
    fileUrl: { type: String, required: true },
    captionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caption' },
    status: { type: String, default: 'draft' },
    scheduledAt: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.models.Video || mongoose.model('Video', VideoSchema) 