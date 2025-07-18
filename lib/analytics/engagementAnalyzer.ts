export function calculateEngagementRate(views: number, likes: number, comments: number, shares: number): number {
  const totalEngagements = likes + comments + shares;
  if (views === 0) return 0;
  return (totalEngagements / views) * 100;
}

export function getTopPerformingVideos(posts: any[], limit = 5): any[] {
  return posts
    .sort((a, b) => calculateEngagementRate(b.views, b.likes, b.comments, b.shares) - calculateEngagementRate(a.views, a.likes, a.comments, a.shares))
    .slice(0, limit);
} 