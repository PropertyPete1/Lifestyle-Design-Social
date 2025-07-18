'use client'

import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import LoadingSpinner from './ui/LoadingSpinner';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  totalVideos: number;
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  engagementRate: number;
  scheduledPosts: number;
  activePlatforms: number;
}

interface PlatformStatus {
  platform: string;
  connected: boolean;
  lastSync: string;
  status: 'active' | 'inactive' | 'error';
}

interface RecentPost {
  id: number;
  title: string;
  platform: string;
  status: 'published' | 'scheduled' | 'draft';
  publishedAt: string;
  views: number;
  likes: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data with individual error handling
        const [statsResult, platformsResult, postsResult] = await Promise.allSettled([
          apiClient.get('/analytics/overview'),
          apiClient.get('/platforms/status'),
          apiClient.get('/posts?limit=5')
        ]);

        // Handle stats response
        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value.data);
        } else {
          // Failed to fetch stats
          setStats({
            totalVideos: 0,
            totalPosts: 0,
            totalViews: 0,
            totalLikes: 0,
            totalShares: 0,
            engagementRate: 0,
            scheduledPosts: 0,
            activePlatforms: 0
          });
        }

        // Handle platforms response
        if (platformsResult.status === 'fulfilled') {
          setPlatforms(platformsResult.value.data);
        } else {
          // Failed to fetch platforms
          setPlatforms([]);
        }

        // Handle posts response
        if (postsResult.status === 'fulfilled') {
          setRecentPosts(postsResult.value.data);
        } else {
          // Failed to fetch posts
          setRecentPosts([]);
        }

          } catch (error) {
      // Error fetching dashboard data
    } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="page-container">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="page-container animate-fade-in">
        {/* Lifestyle Header */}
        <div className="lifestyle-header">
          Lifestyle
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-white mb-4 tracking-wide">
            Dashboard
          </h1>
          <p className="text-lg text-gray-400 font-light">
            Real Estate Auto-Posting Platform
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-6xl w-full">
          <div className="stat-card animate-fade-in">
            <div className="text-center">
              <p className="text-gray-400 text-sm font-light uppercase tracking-wider mb-2">Total Videos</p>
              <p className="text-3xl font-light text-white mb-1">
                {stats?.totalVideos?.toLocaleString() || '0'}
              </p>
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-center">
              <p className="text-gray-400 text-sm font-light uppercase tracking-wider mb-2">Total Posts</p>
              <p className="text-3xl font-light text-white mb-1">
                {stats?.totalPosts?.toLocaleString() || '0'}
              </p>
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <p className="text-gray-400 text-sm font-light uppercase tracking-wider mb-2">Total Views</p>
              <p className="text-3xl font-light text-white mb-1">
                {stats?.totalViews?.toLocaleString() || '0'}
              </p>
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <p className="text-gray-400 text-sm font-light uppercase tracking-wider mb-2">Engagement</p>
              <p className="text-3xl font-light text-white mb-1">
                {stats?.engagementRate?.toFixed(1) || '0.0'}%
              </p>
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Matching Reference Photo */}
        <div className="button-stack animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button className="btn-primary animate-glow">
            Upload New Video
          </button>
          <button className="btn-secondary">
            View Analytics
          </button>
          <button className="btn-secondary">
            Manage Posts
          </button>
          <button className="btn-secondary">
            Platform Settings
          </button>
          <button className="btn-secondary">
            Account Settings
          </button>
        </div>

        {/* Platform Status Section */}
        <div className="w-full max-w-2xl mt-12">
          <h2 className="text-xl font-light text-white mb-6 text-center tracking-wide">Platform Status</h2>
          <div className="space-y-3">
            {platforms.length > 0 ? platforms.map((platform, index) => (
              <div key={index} className="glass-card flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    platform.status === 'active' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 
                    platform.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-white font-light">{platform.platform}</span>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full border ${
                  platform.connected 
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                    : 'border-red-400 text-red-400 bg-red-400/10'
                }`}>
                  {platform.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            )) : (
              <div className="glass-card text-center py-8">
                <p className="text-gray-400 font-light mb-4">No platforms connected yet</p>
                <button className="btn-secondary">
                  Connect Platform
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Posts Section */}
        <div className="w-full max-w-2xl mt-12">
          <h2 className="text-xl font-light text-white mb-6 text-center tracking-wide">Recent Posts</h2>
          <div className="space-y-3">
            {recentPosts.length > 0 ? recentPosts.map((post) => (
              <div key={post.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-light text-sm">{post.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{post.platform} • {post.publishedAt}</p>
                  </div>
                  <span className={`status-badge ${
                    post.status === 'published' ? 'status-published' :
                    post.status === 'scheduled' ? 'status-scheduled' : 'status-processing'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="glass-card text-center py-8">
                <p className="text-gray-400 font-light mb-4">No recent posts</p>
                <button className="btn-secondary">
                  Create First Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Branding */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 text-sm font-light tracking-wider">
            LIFESTYLE DESIGN REALTY
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 