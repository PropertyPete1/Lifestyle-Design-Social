import dbConnect from "../db";
import mongoose from "mongoose";

const InstagramPostSchema = new mongoose.Schema({
  caption: String,
  videoUrl: String,
  timestamp: { type: Date, default: Date.now },
});

const InstagramPost =
  mongoose.models.InstagramPost || mongoose.model("InstagramPost", InstagramPostSchema);

export async function logInstagramPost(caption: string, videoUrl: string) {
  await dbConnect();
  const post = new InstagramPost({ caption, videoUrl });
  await post.save();
} 