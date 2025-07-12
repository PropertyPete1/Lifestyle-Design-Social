'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Dashboard from '@/components/Dashboard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const InstagramLearningContent = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const startAnalysis = () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instagram Learning AI</h1>
        <p className="text-gray-600">Analyze your Instagram content to learn your style and optimize future posts</p>
      </div>
      
      {/* Connection Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-pink-600 text-xl font-bold">IG</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Instagram Account</h3>
              <p className="text-sm text-gray-500">@your_real_estate_account</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
            <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
              Reconnect
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Analysis</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Sync Recent Posts</h4>
              <p className="text-sm text-gray-500">Analyze your last 50 Instagram posts for style patterns</p>
            </div>
            <button 
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>
          
          {isAnalyzing && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Learned Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Writing Style Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tone</span>
              <span className="text-sm font-medium text-gray-900">Professional & Friendly</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Caption Length</span>
              <span className="text-sm font-medium text-gray-900">127 characters</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Emoji Usage</span>
              <span className="text-sm font-medium text-gray-900">High (🏠🔑✨)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Call-to-Action Style</span>
              <span className="text-sm font-medium text-gray-900">Question-based</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Content Patterns</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Best Posting Time</span>
              <span className="text-sm font-medium text-gray-900">6:00 PM - 8:00 PM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Top Hashtags</span>
              <span className="text-sm font-medium text-gray-900">#realestate #dreamhome</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Content Type</span>
              <span className="text-sm font-medium text-gray-900">Property Tours (68%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Engagement Rate</span>
              <span className="text-sm font-medium text-gray-900">8.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Posts (Learning Source)</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4].map((post) => (
            <div key={post} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Stunning 4BR Home in Downtown</h4>
                  <p className="text-sm text-gray-500">Posted 3 days ago</p>
                  <p className="text-xs text-gray-400 mt-1">
                    &quot;🏠 JUST LISTED! This stunning 4-bedroom home features... What&apos;s your dream home feature? 🔑✨&quot;
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="text-center">
                  <p className="font-medium text-gray-900">2.4K</p>
                  <p>Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">127</p>
                  <p>Comments</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">43</p>
                  <p>Shares</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-green-600">12.1%</p>
                  <p>Engagement</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Recommendations</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Optimal Posting Time</h4>
                <p className="text-sm text-blue-700">Your audience is most active between 6-8 PM. Consider scheduling posts during this window for 23% higher engagement.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-900">Caption Style</h4>
                <p className="text-sm text-green-700">Your question-based CTAs perform 31% better than statement CTAs. Continue using this engaging approach.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Hashtag Optimization</h4>
                <p className="text-sm text-yellow-700">Try mixing popular hashtags (#realestate) with niche ones (#luxuryhomes) for better reach. Aim for 8-12 hashtags per post.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InstagramLearningPage() {
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
          <p className="text-gray-600">Please log in to access Instagram Learning.</p>
        </div>
      </div>
    )
  }

  return (
    <Dashboard>
      <InstagramLearningContent />
    </Dashboard>
  )
} 