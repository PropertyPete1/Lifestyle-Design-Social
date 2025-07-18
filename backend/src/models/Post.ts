import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  caption: String,
  hashtags: [String],
  platform: String,
  scheduledTime: Date,
  status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
  result: Object
});

export default mongoose.model('Post', PostSchema);
