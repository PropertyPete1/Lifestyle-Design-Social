export interface Video {
  id: string;
  title: string;
  scheduledDate?: string;
  videoUrl?: string;
  caption?: string;
}

export * from './scheduler'; 