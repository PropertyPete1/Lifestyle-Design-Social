export interface Video {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  isCartoon: boolean;
  createdAt: string;
}

export interface UploadedVideo {
  url: string;
  type: 'real' | 'cartoon';
  caption?: string;
  createdAt: string;
} 