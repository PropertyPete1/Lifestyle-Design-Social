export interface VideoMetadata {
  id: string;
  filename: string;
  caption: string;
  type: 'real' | 'cartoon';
  scheduledTime: string;
  postedToInstagram: boolean;
  postedToYouTube: boolean;
}

export interface YouTubePostPayload {
  title: string;
  description: string;
  tags: string[];
  buffer: Buffer;
} 