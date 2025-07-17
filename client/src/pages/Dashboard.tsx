import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  VideoCameraIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalVideos: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

interface RecentPost {
  id: number;
  title: string;
  platform: string;
  status: 'published' | 'scheduled' | 'failed';
  scheduledAt: string;
  views?: number;
  likes?: number;
  comments?: number;
}

interface PlatformStatus {
  connected: boolean;
  lastPost?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  color?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [platformStatus, setPlatformStatus] = useState<Record<string, PlatformStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Fetch data with individual error handling
      const [statsResult, postsResult, statusResult] = await Promise.allSettled([
        axios.get('/api/analytics/overview'),
        axios.get('/api/posts?limit=5'),
        axios.get('/api/platforms/status')
      ]);
      
      // Handle stats response
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      } else {
        console.error('Failed to fetch stats:', statsResult.reason);
        setStats({
          totalVideos: 0,
          scheduledPosts: 0,
          publishedPosts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
        });
      }
      
      // Handle posts response
      if (postsResult.status === 'fulfilled') {
        setRecentPosts(postsResult.value.data);
      } else {
        console.error('Failed to fetch posts:', postsResult.reason);
        setRecentPosts([]);
      }
      
      // Handle platform status response
      if (statusResult.status === 'fulfilled') {
        setPlatformStatus(statusResult.value.data);
      } else {
        console.error('Failed to fetch platform status:', statusResult.reason);
        setPlatformStatus({});
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set all default values as fallback
      setStats({
        totalVideos: 0,
        scheduledPosts: 0,
        publishedPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
      });
      setRecentPosts([]);
      setPlatformStatus({});
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color = 'yellow' }) => (
    <div className="card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-yellow-200 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-500 bg-opacity-20`}>
          <Icon className={`h-8 w-8 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon: Icon, href, color = 'yellow' }) => (
    <Link to={href} className="card-hover group">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-500 bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
        <div>
          <h3 className="text-white font-semibold group-hover:text-yellow-300 transition-colors">
            {title}
          </h3>
          <p className="text-yellow-200 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome to Your Real Estate Auto-Posting Dashboard</h1>
        <p className="text-yellow-200 text-lg">Manage your content and track performance across all platforms</p>
      </div>

      {/* Platform Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(platformStatus).map(([platform, status]) => (
          <div key={platform} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-white font-semibold capitalize">{platform}</span>
              </div>
              <span className={`text-sm ${status.connected ? 'text-green-400' : 'text-red-400'}`}>
                {status.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {status.connected && (
              <p className="text-yellow-200 text-sm mt-2">
                Last post: {status.lastPost ? new Date(status.lastPost).toLocaleDateString() : 'Never'}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Videos"
          value={stats.totalVideos?.toLocaleString() || '0'}
          change={12}
          icon={VideoCameraIcon}
          color="blue"
        />
        <StatCard
          title="Scheduled Posts"
          value={stats.scheduledPosts?.toLocaleString() || '0'}
          change={-5}
          icon={CalendarIcon}
          color="yellow"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews?.toLocaleString() || '0'}
          change={23}
          icon={EyeIcon}
          color="green"
        />
        <StatCard
          title="Total Engagement"
          value={((stats.totalLikes + stats.totalComments + stats.totalShares) || 0).toLocaleString()}
          change={18}
          icon={ArrowTrendingUpIcon}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickAction
          title="Upload Video"
          description="Add new real estate content to your library"
          icon={PlusIcon}
          href="/videos"
          color="green"
        />
        <QuickAction
          title="Schedule Post"
          description="Set up automated posting for your content"
          icon={CalendarIcon}
          href="/auto-post"
          color="blue"
        />
        <QuickAction
          title="View Analytics"
          description="Track performance and engagement metrics"
          icon={ChartBarIcon}
          href="/analytics"
          color="purple"
        />
        <QuickAction
          title="Manage Posts"
          description="Review and edit scheduled content"
          icon={CogIcon}
          href="/posts"
          color="yellow"
        />
        <QuickAction
          title="Cartoon Gallery"
          description="Browse and manage cartoon real estate videos"
          icon={VideoCameraIcon}
          href="/cartoons"
          color="orange"
        />
        <QuickAction
          title="Settings"
          description="Configure your posting preferences"
          icon={CogIcon}
          href="/settings"
          color="gray"
        />
      </div>

      {/* Recent Posts */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Posts</h2>
          <Link to="/posts" className="text-yellow-400 hover:text-yellow-300 font-medium">
            View All →
          </Link>
        </div>
        
        <div className="space-y-4">
          {recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {post.status === 'published' && <CheckCircleIcon className="h-5 w-5 text-green-400" />}
                    {post.status === 'scheduled' && <ClockIcon className="h-5 w-5 text-yellow-400" />}
                    {post.status === 'failed' && <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{post.title}</h3>
                    <p className="text-yellow-200 text-sm">{post.platform} • {new Date(post.scheduledAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  {post.status === 'published' && (
                    <>
                      <div className="text-center">
                        <p className="text-white font-semibold">{post.views?.toLocaleString() || '0'}</p>
                        <p className="text-yellow-200 text-xs">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">{post.likes?.toLocaleString() || '0'}</p>
                        <p className="text-yellow-200 text-xs">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">{post.comments?.toLocaleString() || '0'}</p>
                        <p className="text-yellow-200 text-xs">Comments</p>
                      </div>
                    </>
                  )}
                  <span className={`status-badge ${
                    post.status === 'published' ? 'bg-green-100 text-green-800' :
                    post.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No posts yet</h3>
              <p className="text-yellow-200 mb-4">Start by uploading videos and scheduling your first post</p>
              <Link to="/videos" className="btn-primary">
                Upload Your First Video
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Engagement Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HeartIcon className="h-5 w-5 text-red-400" />
                <span className="text-white">Likes</span>
              </div>
              <span className="text-white font-semibold">{stats.totalLikes?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftIcon className="h-5 w-5 text-blue-400" />
                <span className="text-white">Comments</span>
              </div>
              <span className="text-white font-semibold">{stats.totalComments?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShareIcon className="h-5 w-5 text-green-400" />
                <span className="text-white">Shares</span>
              </div>
              <span className="text-white font-semibold">{stats.totalShares?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Content Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white">Published Posts</span>
              <span className="text-green-400 font-semibold">{stats.publishedPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Scheduled Posts</span>
              <span className="text-yellow-400 font-semibold">{stats.scheduledPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Total Videos</span>
              <span className="text-blue-400 font-semibold">{stats.totalVideos}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Quick Tips</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-yellow-200">Post 3 times daily for maximum engagement</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-yellow-200">Use trending hashtags to increase reach</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-yellow-200">Alternate between real estate and cartoon videos</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-yellow-200">Monitor analytics to optimize posting times</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 