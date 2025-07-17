'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Layout from '@/components/Layout'
import { apiClient } from '@/lib/api-client'

interface Platform {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  connected?: boolean;
}

interface AutoPostSettings {
  isAutoPostingEnabled: boolean;
  selectedPlatforms: string[];
  postsPerDay: number;
  minTimeBetweenPosts: number;
  optimalTimingEnabled: boolean;
  autoCaptionEnabled: boolean;
  smartHashtagEnabled: boolean;
}

interface ScheduledPost {
  id: number;
  title: string;
  platform: string[];
  scheduledTime: string;
  status: 'scheduled' | 'posted' | 'failed';
  videoId: number;
}

interface AutoPostStats {
  totalAutoPosts: number;
  successRate: number;
  avgEngagement: number;
}

export default function AutoPostPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<AutoPostSettings>({
    isAutoPostingEnabled: true,
    selectedPlatforms: ['instagram', 'tiktok'],
    postsPerDay: 3,
    minTimeBetweenPosts: 3,
    optimalTimingEnabled: true,
    autoCaptionEnabled: true,
    smartHashtagEnabled: true,
  })
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [stats, setStats] = useState<AutoPostStats>({
    totalAutoPosts: 0,
    successRate: 0,
    avgEngagement: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAutoPostData()
    }
  }, [user])

  const platforms: Platform[] = [
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-500', enabled: true, connected: true },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black', enabled: true, connected: true },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-500', enabled: false, connected: false },
  ]

  const fetchAutoPostData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch settings, scheduled posts, and stats in parallel
      const [settingsRes, postsRes, statsRes] = await Promise.all([
        apiClient.get('/autopost/settings').catch(() => ({ data: {} })),
        apiClient.get('/posts?status=scheduled&limit=10').catch(() => ({ data: [] })),
        apiClient.get('/analytics/auto-post-stats').catch(() => ({ data: {} }))
      ])

      if (settingsRes.data) {
        setSettings(prev => ({ ...prev, ...settingsRes.data }))
      }

      if (postsRes.data) {
        setScheduledPosts(postsRes.data)
      }

      if (statsRes.data) {
        setStats(prev => ({ ...prev, ...statsRes.data }))
      }
    } catch (error) {
      console.error('Failed to fetch auto-post data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlatform = (platformId: string) => {
    setSettings(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId) 
        ? prev.selectedPlatforms.filter(id => id !== platformId)
        : [...prev.selectedPlatforms, platformId]
    }))
  }

  const updateSettings = async (newSettings: Partial<AutoPostSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      
      await apiClient.put('/autopost/settings', updatedSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
      // Revert on error
      setSettings(settings)
    }
  }

  const scheduleNewPosts = async () => {
    try {
      setIsLoading(true)
      
      await apiClient.post('/posts/auto-schedule', {
        days: 7,
        postsPerDay: settings.postsPerDay,
        platforms: settings.selectedPlatforms
      })
      
      // Refresh data
      await fetchAutoPostData()
    } catch (error) {
      console.error('Failed to schedule posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60))
      
      if (diffHours < 1) return 'Soon'
      if (diffHours < 24) return `In ${diffHours} hours`
      
      const diffDays = Math.round(diffHours / 24)
      return `In ${diffDays} days`
    } catch {
      return 'Unknown'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <Layout title="Auto-Posting">
      <div className="space-y-6">
        {/* Auto-Posting Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Auto-Posting Status</h3>
              <p className="text-sm text-gray-500">
                {settings.isAutoPostingEnabled ? 'Automatically posting to selected platforms' : 'Auto-posting is disabled'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.isAutoPostingEnabled}
                onChange={(e) => updateSettings({ isAutoPostingEnabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Selection</h3>
          <div className="space-y-3">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">
                      {platform.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{platform.name}</h4>
                    <p className="text-sm text-gray-500">
                      {platform.connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.selectedPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    disabled={!platform.enabled}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Posting Schedule */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Posting Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posts per day
              </label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.postsPerDay}
                onChange={(e) => updateSettings({ postsPerDay: parseInt(e.target.value) })}
              >
                <option value={1}>1 post per day</option>
                <option value={2}>2 posts per day</option>
                <option value={3}>3 posts per day</option>
                <option value={4}>4 posts per day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum time between posts
              </label>
              <select 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={settings.minTimeBetweenPosts}
                onChange={(e) => updateSettings({ minTimeBetweenPosts: parseInt(e.target.value) })}
              >
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Optimization Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Optimization</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Optimal Timing Analysis</h4>
                <p className="text-sm text-gray-500">AI analyzes your audience activity for best posting times</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.optimalTimingEnabled}
                  onChange={(e) => updateSettings({ optimalTimingEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto Caption Generation</h4>
                <p className="text-sm text-gray-500">Generate engaging captions using AI</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.autoCaptionEnabled}
                  onChange={(e) => updateSettings({ autoCaptionEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Smart Hashtag Selection</h4>
                <p className="text-sm text-gray-500">Automatically select trending and relevant hashtags</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.smartHashtagEnabled}
                  onChange={(e) => updateSettings({ smartHashtagEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Schedule New Posts Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Schedule Management</h3>
              <p className="text-sm text-gray-500">Create new scheduled posts for the next week</p>
            </div>
            <button
              onClick={scheduleNewPosts}
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Scheduling...' : 'Schedule New Posts'}
            </button>
          </div>
        </div>

        {/* Next Scheduled Posts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Next Scheduled Posts</h3>
          <div className="space-y-3">
            {scheduledPosts.length > 0 ? scheduledPosts.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-9 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{post.title}</h4>
                    <p className="text-sm text-gray-500">
                      {formatTime(post.scheduledTime)} • {post.platform.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    post.status === 'posted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {post.status}
                  </span>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No scheduled posts yet</p>
                <button
                  onClick={scheduleNewPosts}
                  className="btn-primary mt-4"
                >
                  Schedule Your First Posts
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.totalAutoPosts}</div>
            <div className="text-sm text-gray-600">Total Auto-Posts</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avgEngagement.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg. Engagement</div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 