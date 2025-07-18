export function predictEngagementScore(video: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  captionLength: number;
  hasTrendingHashtags: boolean;
}): number {
  let score = 0;

  score += (video.likes + video.comments * 2 + video.shares * 3) / (video.views || 1);
  score += video.captionLength > 100 ? 0.1 : 0;
  score += video.hasTrendingHashtags ? 0.2 : 0;

  return Math.min(1, score); // Return a normalized score between 0 and 1
} 