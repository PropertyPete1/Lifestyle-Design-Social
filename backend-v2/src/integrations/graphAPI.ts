import axios from 'axios';
import SettingsModel from '../models/SettingsModel';

interface InstagramPost {
  id: string;
  caption: string;
  media_url: string;
  video_url: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  view_count: number;
  media_type: string;
}

/**
 * Get high-performing Instagram videos using Facebook Graph API
 */
export const getHighPerformingInstagramVideos = async (minViews: number = 10000): Promise<InstagramPost[]> => {
  try {
    const settings = await SettingsModel.findOne();
    
    // 🎭 FOR DEMO/VERCEL DEPLOYMENT - Return mock data for Meta app review
    console.log('🎭 Using mock data for Meta app review demo');
    
    const mockPosts: InstagramPost[] = [
      {
        id: '18123456789012345',
        caption: 'Amazing lifestyle design tips that changed my life! 🏠✨ Transform your space with these simple tricks. #LifestyleDesign #HomeDesign #Inspiration #InteriorDesign',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 1205,
        comments_count: 89,
        view_count: 45280,
        media_type: 'VIDEO'
      },
      {
        id: '18234567890123456', 
        caption: 'Interior design transformation that will blow your mind! 🤯 Modern minimalist style meets functionality. Before and after reveal! #InteriorDesign #Modern #HomeReno',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 892,
        comments_count: 67,
        view_count: 38940,
        media_type: 'VIDEO'
      },
      {
        id: '18345678901234567',
        caption: 'Smart home automation that actually works! 🏡🔌 Tech meets design in perfect harmony. See how I automated my entire house! #SmartHome #TechDesign #Automation',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 734,
        comments_count: 45,
        view_count: 32156,
        media_type: 'VIDEO'
      },
      {
        id: '18456789012345678',
        caption: 'Outdoor living space design ideas for 2024 🌿🏠 Create your perfect backyard oasis with these trending landscape designs! #OutdoorDesign #Landscaping #HomeDesign',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 623,
        comments_count: 38,
        view_count: 28470,
        media_type: 'VIDEO'
      },
      {
        id: '18567890123456789',
        caption: 'Budget-friendly room makeover under $500! 💰✨ Proof that good design doesn\'t have to break the bank. DIY transformation reveal! #BudgetDesign #RoomMakeover #DIY',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), 
        like_count: 567,
        comments_count: 42,
        view_count: 25890,
        media_type: 'VIDEO'
      },
      {
        id: '18678901234567890',
        caption: 'Sustainable design trends taking over 2024! 🌱♻️ Eco-friendly materials that look amazing and help the planet. Green living inspiration! #SustainableDesign #EcoFriendly #GreenLiving',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 498,
        comments_count: 33,
        view_count: 22340,
        media_type: 'VIDEO'
      },
      {
        id: '18789012345678901',
        caption: 'Small space, big impact! 🏠✨ Maximize every square foot with these genius storage solutions and design tricks. Studio apartment transformation! #SmallSpaceDesign #Storage #Apartment',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 445,
        comments_count: 29,
        view_count: 19580,
        media_type: 'VIDEO'  
      },
      {
        id: '18890123456789012',
        caption: 'Color psychology in interior design! 🎨🧠 How different colors affect your mood and productivity. Choose the right palette for every room! #ColorPsychology #InteriorDesign #HomeDecor',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        like_count: 389,
        comments_count: 25,
        view_count: 17230,
        media_type: 'VIDEO'
      }
    ];

    // Filter by minViews threshold
    const filteredPosts = mockPosts.filter(post => post.view_count >= minViews);
    
    console.log(`✅ Generated ${filteredPosts.length} mock high-performing videos (${minViews}+ views) for demo`);
    
    return filteredPosts;

    // 🚫 COMMENTED OUT REAL API CALL - Will re-enable after Meta approval
    /*
    if (!settings?.instagramToken || !settings?.instagramAccount) {
      throw new Error('Instagram credentials not configured in settings');
    }

    console.log(`📱 Fetching high-performing videos from Instagram (min ${minViews} views)...`);

    // Fetch latest 500 posts from Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/${settings.instagramAccount}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,timestamp,like_count,comments_count,insights.metric(impressions,reach,video_views)',
        limit: 500,
        access_token: settings.instagramToken
      }
    });

    const posts = response.data.data || [];
    const highPerformingVideos: InstagramPost[] = [];

    for (const post of posts) {
      // Only process videos
      if (post.media_type !== 'VIDEO') continue;

      // Extract video views - try video_views first, fallback to reach for reels
      const videoViewsMetric = post.insights?.data?.find((metric: any) => metric.name === 'video_views')?.values?.[0]?.value;
      const reachMetric = post.insights?.data?.find((metric: any) => metric.name === 'reach')?.values?.[0]?.value;
      const viewCount = videoViewsMetric || reachMetric || 0;

      // Filter by view count threshold
      if (viewCount >= minViews) {
        highPerformingVideos.push({
          id: post.id,
          caption: post.caption || '',
          media_url: post.media_url,
          video_url: post.media_url, // For videos, media_url is the video URL
          timestamp: post.timestamp,
          like_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          view_count: viewCount,
          media_type: post.media_type
        });
      }
    }

    // Sort by view count (highest first)
    highPerformingVideos.sort((a, b) => b.view_count - a.view_count);

    console.log(`✅ Found ${highPerformingVideos.length} high-performing videos (${minViews}+ views)`);
    
    return highPerformingVideos;
    */
    
  } catch (error: any) {
    console.error('❌ Failed to fetch Instagram videos:', error);
    
    // Provide helpful error messages
    if (error.response?.status === 400) {
      if (error.response.data?.error?.code === 190) {
        throw new Error('Instagram access token is expired or invalid. Please refresh your Instagram token.');
      } else if (error.response.data?.error?.message?.includes('User does not exist')) {
        throw new Error('Instagram account ID is invalid. Please check your Instagram account ID.');
      }
    }
    
    throw new Error(`Instagram API error: ${error.response?.data?.error?.message || error.message}`);
  }
};