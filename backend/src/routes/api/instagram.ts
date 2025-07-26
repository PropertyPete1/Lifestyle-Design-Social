import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get Instagram settings from config
function getInstagramSettings() {
  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'settings.json'),
      path.join(process.cwd(), 'backend', 'settings.json'),
      path.join(__dirname, '..', '..', '..', 'settings.json')
    ];
    
    let settings = null;
    for (const settingsPath of possiblePaths) {
      try {
        if (fs.existsSync(settingsPath)) {
          settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          console.log(`✅ Found Instagram settings at: ${settingsPath}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!settings) {
      console.error('❌ No settings file found');
      return null;
    }
    
    return {
      accessToken: settings.instagramAccessToken,
      businessId: settings.instagramBusinessId
    };
  } catch (error) {
    console.error('Error reading Instagram settings:', error);
    return null;
  }
}

// GET /api/instagram/test
// Test Instagram API credentials
router.get('/test', async (req: Request, res: Response) => {
  try {
    const settings = getInstagramSettings();
    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    console.log('🧪 Testing Instagram API credentials...');

    // Test basic API call to get account info
    const response = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}?fields=id,name,username&access_token=${settings.accessToken}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        success: false,
        error: `Instagram API Error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const accountData = await response.json();

    res.json({
      success: true,
      message: 'Instagram API credentials working!',
      account: {
        id: accountData.id,
        name: accountData.name,
        username: accountData.username
      }
    });

  } catch (error: any) {
    console.error('Instagram API test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram API test failed'
    });
  }
});

// GET /api/instagram/debug
// Debug Instagram API token and permissions
router.get('/debug', async (req: Request, res: Response) => {
  try {
    const settings = getInstagramSettings();
    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    console.log('🔍 Debugging Instagram API token...');

    // Debug access token
    const debugResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${settings.accessToken}&access_token=${settings.accessToken}`);
    
    if (!debugResponse.ok) {
      const errorData = await debugResponse.json();
      return res.status(debugResponse.status).json({
        success: false,
        error: `Token debug failed: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const debugData = await debugResponse.json();

    res.json({
      success: true,
      message: 'Instagram token debug complete',
      tokenInfo: debugData.data,
      businessId: settings.businessId
    });

  } catch (error: any) {
    console.error('Instagram debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram debug failed'
    });
  }
});

// GET /api/instagram/permissions
// Check Instagram API permissions
router.get('/permissions', async (req: Request, res: Response) => {
  try {
    const settings = getInstagramSettings();
    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    console.log('🔐 Checking Instagram API permissions...');

    // Get available permissions
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${settings.accessToken}`);
    
    if (!permissionsResponse.ok) {
      const errorData = await permissionsResponse.json();
      return res.status(permissionsResponse.status).json({
        success: false,
        error: `Permissions check failed: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const permissionsData = await permissionsResponse.json();

    res.json({
      success: true,
      message: 'Instagram permissions retrieved',
      permissions: permissionsData.data,
      requiredPermissions: [
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'pages_read_engagement'
      ]
    });

  } catch (error: any) {
    console.error('Instagram permissions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram permissions check failed'
    });
  }
});

// GET /api/instagram/pages
// Get connected Facebook pages
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const settings = getInstagramSettings();
    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    console.log('📄 Getting connected Facebook pages...');

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${settings.accessToken}`);
    
    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json();
      return res.status(pagesResponse.status).json({
        success: false,
        error: `Pages fetch failed: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const pagesData = await pagesResponse.json();

    res.json({
      success: true,
      message: 'Facebook pages retrieved',
      pages: pagesData.data,
      connectedBusinessId: settings.businessId
    });

  } catch (error: any) {
    console.error('Instagram pages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram pages fetch failed'
    });
  }
});

// GET /api/instagram/media
// Get recent Instagram media
router.get('/media', async (req: Request, res: Response) => {
  try {
    const settings = getInstagramSettings();
    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    console.log('📸 Getting Instagram media...');

    // Get recent media
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=10&access_token=${settings.accessToken}`);
    
    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.json();
      return res.status(mediaResponse.status).json({
        success: false,
        error: `Media fetch failed: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const mediaData = await mediaResponse.json();

    res.json({
      success: true,
      message: 'Instagram media retrieved',
      media: mediaData.data,
      totalCount: mediaData.data?.length || 0
    });

  } catch (error: any) {
    console.error('Instagram media error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram media fetch failed'
    });
  }
});

// POST /api/instagram/post
// Create Instagram post with Phase 4 smart captions
router.post('/post', async (req: Request, res: Response) => {
  try {
    const { mediaUrl, caption } = req.body;
    const settings = getInstagramSettings();

    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Media URL is required'
      });
    }

    console.log('📤 Creating Instagram post...');

    // Step 1: Create media container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image_url: mediaUrl,
        caption: caption || '',
        access_token: settings.accessToken
      })
    });

    if (!containerResponse.ok) {
      const errorData = await containerResponse.json();
      return res.status(containerResponse.status).json({
        success: false,
        error: `Container creation failed: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Step 2: Publish the media
    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: settings.accessToken
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json();
      return res.status(publishResponse.status).json({
        success: false,
        error: `Publish failed: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData
      });
    }

    const publishData = await publishResponse.json();

    res.json({
      success: true,
      message: 'Instagram post created successfully!',
      postId: publishData.id,
      containerId: containerId
    });

  } catch (error: any) {
    console.error('Instagram post error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram post failed'
    });
  }
});

// GET /api/instagram/analytics
// Get Instagram account analytics and insights
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const settings = getInstagramSettings();
    if (!settings || !settings.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram access token not configured'
      });
    }

    console.log('📊 Getting Instagram analytics...');

    // Get account info
    const accountResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}?fields=id,name,username,followers_count,media_count&access_token=${settings.accessToken}`);
    
    let accountData: any = {};
    if (accountResponse.ok) {
      accountData = await accountResponse.json();
    }

    // Get recent media with insights
    const mediaResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${settings.accessToken}`);
    
    let mediaData = { data: [] };
    let totalLikes = 0;
    let totalComments = 0;
    let totalEngagement = 0;
    
    if (mediaResponse.ok) {
      mediaData = await mediaResponse.json();
      
      // Calculate engagement stats
      if (mediaData.data && Array.isArray(mediaData.data)) {
        totalLikes = mediaData.data.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0);
        totalComments = mediaData.data.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);
        totalEngagement = totalLikes + totalComments;
      }
    }

    // Get account insights (if available)
    const insightsResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/insights?metric=impressions,reach,profile_views&period=day&since=2024-01-01&access_token=${settings.accessToken}`);
    
    let insightsData = { data: [] };
    if (insightsResponse.ok) {
      insightsData = await insightsResponse.json();
    }

    res.json({
      success: true,
      message: 'Instagram analytics retrieved',
      analytics: {
        account: {
          id: accountData.id || settings.businessId,
          name: accountData.name || 'Instagram Business Account',
          username: accountData.username || '',
          followers: accountData.followers_count || 0,
          posts: accountData.media_count || (mediaData.data?.length || 0),
          totalLikes,
          totalComments,
          totalEngagement,
          engagementRate: accountData.followers_count ? 
            ((totalEngagement / (accountData.followers_count * (mediaData.data?.length || 1))) * 100).toFixed(2) : '0.00'
        },
        recentMedia: mediaData.data?.slice(0, 10) || [],
        insights: insightsData.data || [],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Instagram analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Instagram analytics fetch failed'
    });
  }
});

// GET /api/instagram/status
// Get Instagram API integration status
router.get('/status', (req: Request, res: Response) => {
  const settings = getInstagramSettings();
  
  res.json({
    success: true,
    message: 'Instagram API endpoints ready',
    configured: !!(settings?.accessToken && settings?.businessId),
    businessId: settings?.businessId || null,
    endpoints: [
      'GET /api/instagram/test',
      'GET /api/instagram/debug', 
      'GET /api/instagram/permissions',
      'GET /api/instagram/pages',
      'GET /api/instagram/media',
      'GET /api/instagram/analytics',
      'POST /api/instagram/post'
    ]
  });
});

export default router; 