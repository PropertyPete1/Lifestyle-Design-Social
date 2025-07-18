export type PostCategory = 'real_estate' | 'cartoon';

export type PlatformPost = {
  mediaUrl: string;
  caption: string;
  platform: 'instagram' | 'youtube';
  type: PostCategory;
}; 