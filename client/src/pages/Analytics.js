import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUpIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState({
    summary: {
      totalPosts: 0,
      publishedPosts: 0,
      successRate: 0
    },
    engagement: {
      total: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      },
      average: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0
      }
    },
    posts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [timeRange, selectedPlatform, token]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/analytics?timeRange=${timeRange}&platform=${selectedPlatform}`, {
        headers: {
          'x-auth-token': token
        }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#FFD700', '#FFA500', '#FF6B35', '#4ECDC4', '#45B7D1'];

  const MetricCard = ({ title, value, change, icon: Icon, color = 'yellow' }) => (
    <div className="card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-yellow-200 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value || '0'}</p>
          {change && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-500 bg-opacity-20`}>
          <Icon className={`h-8 w-8 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error Loading Analytics</div>
          <p className="text-yellow-200 mb-4">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-yellow-200">Track your real estate content performance across all platforms</p>
        </div>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="input-field"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Views"
          value={analytics.engagement?.total?.views?.toLocaleString() || '0'}
          icon={EyeIcon}
          color="blue"
        />
        <MetricCard
          title="Total Likes"
          value={analytics.engagement?.total?.likes?.toLocaleString() || '0'}
          icon={HeartIcon}
          color="red"
        />
        <MetricCard
          title="Total Comments"
          value={analytics.engagement?.total?.comments?.toLocaleString() || '0'}
          icon={ChatBubbleLeftIcon}
          color="green"
        />
        <MetricCard
          title="Total Shares"
          value={analytics.engagement?.total?.shares?.toLocaleString() || '0'}
          icon={ShareIcon}
          color="purple"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Post Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-yellow-200">Total Posts:</span>
              <span className="text-white font-semibold">{analytics.summary?.totalPosts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-200">Published:</span>
              <span className="text-white font-semibold">{analytics.summary?.publishedPosts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-200">Success Rate:</span>
              <span className="text-white font-semibold">{analytics.summary?.successRate || 0}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Average Engagement</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-yellow-200">Avg Views:</span>
              <span className="text-white font-semibold">{analytics.engagement?.average?.views || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-200">Avg Likes:</span>
              <span className="text-white font-semibold">{analytics.engagement?.average?.likes || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-200">Avg Comments:</span>
              <span className="text-white font-semibold">{analytics.engagement?.average?.comments || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Time Range</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-yellow-200">Period:</span>
              <span className="text-white font-semibold">{analytics.timeRange || timeRange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-200">Platform:</span>
              <span className="text-white font-semibold">{analytics.platform || selectedPlatform}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      {analytics.posts && analytics.posts.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-6">Recent Posts</h3>
          <div className="space-y-4">
            {analytics.posts.slice(0, 5).map((post, index) => (
              <div key={post.id || index} className="flex items-center space-x-4 p-4 bg-white bg-opacity-5 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold">
                    #{index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{post.content?.substring(0, 50) || 'Untitled Post'}...</h4>
                  <p className="text-yellow-200 text-sm">{post.platform || 'Unknown'} • {post.createdAt || 'Unknown date'}</p>
                </div>
                <div className="flex space-x-6 text-sm">
                  <div className="text-center">
                    <p className="text-white font-semibold">{post.engagement?.views || 0}</p>
                    <p className="text-yellow-200">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{post.engagement?.likes || 0}</p>
                    <p className="text-yellow-200">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{post.engagement?.comments || 0}</p>
                    <p className="text-yellow-200">Comments</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {(!analytics.posts || analytics.posts.length === 0) && (
        <div className="card text-center py-12">
          <div className="text-yellow-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-white mb-2">No Analytics Data Yet</h3>
          <p className="text-yellow-200 mb-4">Start posting content to see your analytics here!</p>
          <button 
            onClick={() => window.location.href = '/videos'}
            className="btn-primary"
          >
            Upload Your First Video
          </button>
        </div>
      )}
    </div>
  );
};

export default Analytics; 