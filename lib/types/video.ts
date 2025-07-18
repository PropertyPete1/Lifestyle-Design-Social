export interface Video {
  _id?: string;
  url: string;
  caption: string;
  hashtags: string[];
  platform: 'instagram' | 'youtube';
  type: 'real' | 'cartoon';
  scheduledAt: string;
  createdAt: string;
  updatedAt?: string;
} 