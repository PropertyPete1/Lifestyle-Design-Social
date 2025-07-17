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
    timeSignature: number;
    duration: number;
  };
  moodAnalysis: {
    primaryMood: string;
    secondaryMood?: string;
    confidence: number;
    emotions: {
      happy: number;
      sad: number;
      energetic: number;
      calm: number;
      aggressive: number;
      romantic: number;
    };
  };
  genreClassification: {
    primaryGenre: string;
    secondaryGenre?: string;
    confidence: number;
    genres: {
      [genre: string]: number;
    };
  };
  spectralFeatures: {
    spectralCentroid: number[];
    spectralRolloff: number[];
    spectralBandwidth: number[];
    mfcc: number[][];
    chroma: number[][];
    tonnetz: number[][];
  };
  rhythmFeatures: {
    beatPositions: number[];
    barPositions: number[];
    onsetTimes: number[];
    rhythmPattern: string;
  };
  recommendations: {
    suggestedMusicGenres: string[];
    suggestedMoods: string[];
    compatibleTracks: string[];
    energyLevel: 'low' | 'medium' | 'high';
    recommendedTempo: number;
  };
  processingMetadata: {
    analysisVersion: string;
    processingTime: number;
    audioQuality: 'low' | 'medium' | 'high';
    sampleRate: number;
    channels: number;
    bitRate?: number;
  };
  isProcessed: boolean;
  processingError?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const audioAnalysisSchema = new Schema<IAudioAnalysis>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  videoId: {
    type: String,
    required: true,
    ref: 'Video'
  },
  audioFile: {
    type: String,
    required: true,
    trim: true
  },
  analysisData: {
    tempo: {
      type: Number,
      required: true,
      min: 0,
      max: 300
    },
    energy: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    danceability: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    valence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    acousticness: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    instrumentalness: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    liveness: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    speechiness: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    loudness: {
      type: Number,
      required: true,
      min: -60,
      max: 0
    },
    key: {
      type: Number,
      required: true,
      min: 0,
      max: 11
    },
    mode: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    timeSignature: {
      type: Number,
      required: true,
      min: 3,
      max: 7
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    }
  },
  moodAnalysis: {
    primaryMood: {
      type: String,
      required: true,
      trim: true
    },
    secondaryMood: {
      type: String,
      trim: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    emotions: {
      happy: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      sad: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      energetic: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      calm: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      aggressive: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      },
      romantic: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
      }
    }
  },
  genreClassification: {
    primaryGenre: {
      type: String,
      required: true,
      trim: true
    },
    secondaryGenre: {
      type: String,
      trim: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    genres: {
      type: Map,
      of: Number
    }
  },
  spectralFeatures: {
    spectralCentroid: [{
      type: Number
    }],
    spectralRolloff: [{
      type: Number
    }],
    spectralBandwidth: [{
      type: Number
    }],
    mfcc: [[Number]],
    chroma: [[Number]],
    tonnetz: [[Number]]
  },
  rhythmFeatures: {
    beatPositions: [{
      type: Number
    }],
    barPositions: [{
      type: Number
    }],
    onsetTimes: [{
      type: Number
    }],
    rhythmPattern: {
      type: String,
      trim: true
    }
  },
  recommendations: {
    suggestedMusicGenres: [{
      type: String,
      trim: true
    }],
    suggestedMoods: [{
      type: String,
      trim: true
    }],
    compatibleTracks: [{
      type: String,
      trim: true
    }],
    energyLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    recommendedTempo: {
      type: Number,
      required: true,
      min: 0,
      max: 300
    }
  },
  processingMetadata: {
    analysisVersion: {
      type: String,
      required: true,
      trim: true
    },
    processingTime: {
      type: Number,
      required: true,
      min: 0
    },
    audioQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    sampleRate: {
      type: Number,
      required: true,
      min: 8000
    },
    channels: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    bitRate: {
      type: Number,
      min: 32
    }
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingError: {
    type: String,
    trim: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Create indexes
audioAnalysisSchema.index({ userId: 1, videoId: 1 }, { unique: true });
audioAnalysisSchema.index({ videoId: 1 });
audioAnalysisSchema.index({ 'moodAnalysis.primaryMood': 1 });
audioAnalysisSchema.index({ 'genreClassification.primaryGenre': 1 });
audioAnalysisSchema.index({ 'analysisData.tempo': 1 });
audioAnalysisSchema.index({ 'analysisData.energy': 1 });
audioAnalysisSchema.index({ isProcessed: 1 });
audioAnalysisSchema.index({ expiresAt: 1 });

export const AudioAnalysis = mongoose.model<IAudioAnalysis>('AudioAnalysis', audioAnalysisSchema);

// Export model alias for service compatibility
export const AudioAnalysisModel = AudioAnalysis; 