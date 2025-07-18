import mongoose from 'mongoose'

const CaptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prompt: { type: String, required: true },
    caption: { type: String, required: true },
    hashtags: [{ type: String }],
  },
  { timestamps: true }
)

export default mongoose.models.Caption || mongoose.model('Caption', CaptionSchema) 