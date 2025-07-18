import mongoose, { Schema, Document, models } from 'mongoose';

export interface IVideo extends Document {
  filename: string;
  path: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
  createdAt: Date;
}

const VideoSchema: Schema = new Schema<IVideo>(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    duration: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    size: { type: Number, required: true },
    format: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default models.Video || mongoose.model<IVideo>('Video', VideoSchema); 