import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema({
  url: String,
  type: { type: String, enum: ["user", "cartoon"], required: true },
  posted: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
  scheduledAt: Date,
  caption: String,
  hashtags: [String],
  thumbnail: String,
});

export const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema); 