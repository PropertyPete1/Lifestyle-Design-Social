import mongoose from 'mongoose'

const CartoonVideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prompt: { type: String, required: true },
    aspectRatio: { type: String, required: true },
    videoUrl: { type: String, required: true },
    provider: { type: String, default: 'runwayml' },
    status: { type: String, enum: ['pending', 'complete', 'error'], default: 'complete' },
    scheduledFor: { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.models.CartoonVideo || mongoose.model('CartoonVideo', CartoonVideoSchema) 