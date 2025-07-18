import mongoose, { Schema, Document } from 'mongoose';

export interface IAudioAnalysis extends Document {
  userId: string;
  videoId: string;
  audioFile: string;
  analysisData: {
    tempo: number;
    energy: number;
    danceability: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    loudness: number;
    key: number;
    mode: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AudioAnalysisSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    videoId: { type: String, required: true },
    audioFile: { type: String, required: true },
    analysisData: {
      tempo: { type: Number, required: true },
      energy: { type: Number, required: true },
      danceability: { type: Number, required: true },
      valence: { type: Number, required: true },
      acousticness: { type: Number, required: true },
      instrumentalness: { type: Number, required: true },
      liveness: { type: Number, required: true },
      speechiness: { type: Number, required: true },
      loudness: { type: Number, required: true },
      key: { type: Number, required: true },
      mode: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export const AudioAnalysisModel = mongoose.model<IAudioAnalysis>(
  'AudioAnalysis',
  AudioAnalysisSchema
);
