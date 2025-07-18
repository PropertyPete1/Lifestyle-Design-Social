export interface YouTubePostPayload {
  videoUrl: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
} 