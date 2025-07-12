'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Dashboard from '@/components/Dashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const AutoPostContent = () => {
  const [isAutoPostingEnabled, setIsAutoPostingEnabled] = useState(true)
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'tiktok'])

  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-500', enabled: true },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black', enabled: true },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-500', enabled: false },
  ]

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auto-Posting</h1>
        <p className="text-gray-600">Automate your social media posting with AI-driven optimal timing</p>
      </div>
      
      {/* Auto-Posting Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Auto-Posting Status</h3>
            <p className="text-sm text-gray-500">
              {isAutoPostingEnabled ? 'Automatically posting to selected platforms' : 'Auto-posting is disabled'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isAutoPostingEnabled}
              onChange={(e) => setIsAutoPostingEnabled(e.target.checked)}
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
            <div key={platform.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${platform.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold">
                    {platform.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{platform.name}</h4>
                  <p className="text-sm text-gray-500">
                    {platform.enabled ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={selectedPlatforms.includes(platform.id)}
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
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="1">1 post per day</option>
              <option value="2">2 posts per day</option>
              <option value="3" selected>3 posts per day</option>
              <option value="4">4 posts per day</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum time between posts
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="2">2 hours</option>
              <option value="3" selected>3 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
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
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Caption Generation</h4>
              <p className="text-sm text-gray-500">Generate engaging captions using AI</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Smart Hashtag Selection</h4>
              <p className="text-sm text-gray-500">Automatically select trending and relevant hashtags</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Next Scheduled Posts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Next Scheduled Posts</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((post) => (
            <div key={post} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-9 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Real Estate Video {post}</h4>
                  <p className="text-sm text-gray-500">
                    {post === 1 ? 'In 2 hours' : post === 2 ? 'In 5 hours' : 'In 8 hours'} • Instagram, TikTok
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Scheduled
                </span>
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-indigo-600">127</div>
          <div className="text-sm text-gray-600">Total Auto-Posts</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">95.2%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">8.4%</div>
          <div className="text-sm text-gray-600">Avg. Engagement</div>
        </div>
      </div>
    </div>
  )
}

export default function AutoPostPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access auto-posting.</p>
        </div>
      </div>
    )
  }

  return (
    <Dashboard>
      <AutoPostContent />
    </Dashboard>
  )
} 