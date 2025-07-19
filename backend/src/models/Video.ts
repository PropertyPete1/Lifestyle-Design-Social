export interface VideoPost {
  userId: string;
  platform: 'instagram' | 'youtube';
  caption: string;
  videoUrl: string;
  createdAt: Date;
} 