export interface PostStatus {
  id: string;
  caption: string;
  status: 'queued' | 'completed' | 'failed' | 'processing';
  attemptCount: number;
} 