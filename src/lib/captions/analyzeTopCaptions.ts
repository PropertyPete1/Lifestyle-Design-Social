interface Post {
  caption?: string;
  likes?: number;
  comments?: number;
  views?: number;
}

interface CaptionStats {
  text: string;
  likes: number;
  comments: number;
  views: number;
  engagementScore: number;
}

// Mock function for now - would be replaced with actual Instagram API call
async function getRecentPosts(): Promise<Post[]> {
  return [
    {
      caption: "🏡 JUST LISTED! This stunning 3-bedroom gem in Alamo Ranch is EVERYTHING! 🔥\n\n✨ Open concept living\n✨ Chef's kitchen with quartz countertops\n✨ Master suite with walk-in closet\n✨ Backyard oasis perfect for entertaining\n\n📍 Alamo Ranch, San Antonio\n💰 $425,000\n\nDM me for private showing! 👇\n\n#alamoranch #sanantonio #realestate #justlisted #property #home #investment",
      likes: 150,
      comments: 25,
      views: 2000
    },
    {
      caption: "🔥 HOT NEW LISTING ALERT! This incredible 3-bedroom beauty in Alamo Ranch is a MUST-SEE! 🔥\n\n✨ Spacious open floor plan\n✨ Gourmet kitchen with premium finishes\n✨ Luxurious master retreat\n✨ Stunning outdoor living space\n\n📍 Alamo Ranch, San Antonio\n💰 $425,000\n\nReady to make this your dream home? DM me NOW! 👇\n\n#alamoranch #sanantonio #realestate #justlisted #property #home #investment",
      likes: 120,
      comments: 18,
      views: 1800
    }
  ];
}

export async function analyzeTopCaptions(limit = 10): Promise<CaptionStats[]> {
  const posts = await getRecentPosts();
  const captions = posts
    .filter((p: Post) => p.caption)
    .map((post: Post) => ({
      text: post.caption!,
      likes: post.likes || 0,
      comments: post.comments || 0,
      views: post.views || 0,
      engagementScore:
        (post.likes || 0) * 0.5 + (post.comments || 0) * 2 + (post.views || 0) * 0.2,
    }));

  return captions
    .sort((a: CaptionStats, b: CaptionStats) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
} 