export interface Video {
  id: string;
  url: string;
  caption: string;
  type: 'real' | 'cartoon';
  createdAt: string;
  source: 'dropbox' | 'manual';
  description: string;
} 