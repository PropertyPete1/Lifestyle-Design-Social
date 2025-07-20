import { getRecentPosts } from '../instagram/postToInstagram';
import { extractHashtags } from './enhanceCaption';

interface CaptionStats {
  text: string;
  likes: number;
  comments: number;
  views: number;
  engagementScore: number;
}

export async function analyzeTopCaptions(limit = 10): Promise<CaptionStats[]> {
  const posts = await getRecentPosts();
  const captions = posts
    .filter((p) => p.caption)
    .map((post) => ({
      text: post.caption,
      likes: post.likes || 0,
      comments: post.comments || 0,
      views: post.views || 0,
      engagementScore:
        (post.likes || 0) * 0.5 + (post.comments || 0) * 2 + (post.views || 0) * 0.2,
    }));

  return captions
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
} 