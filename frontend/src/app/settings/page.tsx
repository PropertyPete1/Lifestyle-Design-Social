'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { apiClient } from '@/lib/api-client'

interface UserSettings {
  name: string;
  email: string;
  company: string;
}

interface PlatformConnection {
  connected: boolean;
  username?: string;
  lastSync?: string;
}

interface ApiKey {
  name: string;
  configured: boolean;
  masked: string;
}

interface NotificationSettings {
  postNotifications: boolean;
  analyticsReports: boolean;
  securityAlerts: boolean;
  emailNotifications: boolean;
}

const SettingsContent = () => {
  const [activeTab, setActiveTab] = useState('account')
  const [saving, setSaving] = useState(false)
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    email: '',
    company: ''
  })
  
  const [platforms, setPlatforms] = useState<Record<string, PlatformConnection>>({
    instagram: { connected: false },
    tiktok: { connected: false },
    youtube: { connected: false }
  })
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newApiKey, setNewApiKey] = useState({ name: '', value: '' })
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    postNotifications: true,
    analyticsReports: true,
    securityAlerts: true,
    emailNotifications: true
  })

  const tabs = [
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'platforms', name: 'Social Platforms', icon: '🔗' },
    { id: 'api', name: 'API Keys', icon: '🔑' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const [settingsRes, platformsRes, apiKeysRes] = await Promise.all([
        apiClient.get('/settings').catch(() => ({ data: {} })),
        apiClient.get('/platforms/status').catch(() => ({ data: {} })),
        apiClient.get('/settings/api-keys').catch(() => ({ data: { keys: [] } }))
      ])

      if (settingsRes.data) {
        setUserSettings(prev => ({ ...prev, ...settingsRes.data }))
        setNotifications(prev => ({ ...prev, ...settingsRes.data.notifications }))
      }

      if (platformsRes.data) {
        setPlatforms(platformsRes.data)
      }

      if (apiKeysRes.data) {
        setApiKeys(apiKeysRes.data.keys || [])
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const saveUserSettings = async () => {
    try {
      setSaving(true)
      await apiClient.put('/settings', {
        ...userSettings,
        notifications
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const saveApiKey = async () => {
    if (!newApiKey.name || !newApiKey.value) {
      alert('Please enter both key name and value')
      return
    }

    try {
      setSaving(true)
      await apiClient.post('/settings/api-keys', {
        name: newApiKey.name,
        key: newApiKey.value
      })
      
      setNewApiKey({ name: '', value: '' })
      await fetchSettings()
      alert('API key saved successfully!')
    } catch (error) {
      console.error('Failed to save API key:', error)
      alert('Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  const connectPlatform = async (platform: string) => {
    try {
      const response = await apiClient.post(`/oauth/${platform}/authorize`)
      
      if (response.data.authUrl) {
        const authWindow = window.open(
          response.data.authUrl,
          'oauth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        )

        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed)
            setTimeout(() => {
              fetchSettings()
              alert(`${platform} connection initiated! Check if authorization was successful.`)
            }, 1000)
          }
        }, 1000)
      }
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error)
      alert(`Failed to connect ${platform}`)
    }
  }

  const disconnectPlatform = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return

    try {
      await apiClient.delete(`/oauth/${platform}/disconnect`)
      await fetchSettings()
      alert(`${platform} disconnected successfully!`)
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error)
      alert(`Failed to disconnect ${platform}`)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {activeTab === 'account' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userSettings.name}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userSettings.email}
                    onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company/Business Name
                </label>
                <input
                  type="text"
                  value={userSettings.company}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your Real Estate Business"
                />
              </div>
              <div className="pt-4">
                <button 
                  onClick={saveUserSettings}
                  disabled={saving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'platforms' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Platform Connections</h3>
            <div className="space-y-4">
              {[
                { id: 'instagram', name: 'Instagram', color: 'bg-pink-100', textColor: 'text-pink-600', buttonColor: 'bg-pink-600 hover:bg-pink-700' },
                { id: 'tiktok', name: 'TikTok', color: 'bg-gray-100', textColor: 'text-gray-600', buttonColor: 'bg-gray-600 hover:bg-gray-700' },
                { id: 'youtube', name: 'YouTube', color: 'bg-red-100', textColor: 'text-red-600', buttonColor: 'bg-red-600 hover:bg-red-700' }
              ].map((platform) => (
                <div key={platform.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                      <span className={`${platform.textColor} font-bold`}>
                        {platform.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{platform.name}</h4>
                      <p className="text-sm text-gray-500">
                        {platforms[platform.id]?.connected 
                          ? `Connected as @${platforms[platform.id]?.username || 'user'}` 
                          : `Connect your ${platform.name} Business account`
                        }
                      </p>
                    </div>
                  </div>
                  {platforms[platform.id]?.connected ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => disconnectPlatform(platform.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => connectPlatform(platform.id)}
                      className={`${platform.buttonColor} text-white px-4 py-2 rounded-md transition-colors`}
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
            
            {/* Add New API Key */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Add New API Key</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <select
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select service</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={newApiKey.value}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter API key..."
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={saveApiKey}
                    disabled={saving || !newApiKey.name || !newApiKey.value}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing API Keys */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Configured API Keys</h4>
              {apiKeys.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No API keys configured</p>
              ) : (
                apiKeys.map((key, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">{key.name}</h5>
                      <p className="text-sm text-gray-500">
                        {key.configured ? '✅ Configured' : '❌ Not configured'} • {key.masked}
                      </p>
                    </div>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">API Key Information</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>OpenAI:</strong> Used for AI caption generation and content optimization</p>
                <p><strong>Instagram:</strong> Required for Instagram posting and analytics</p>
                <p><strong>TikTok:</strong> Required for TikTok posting and analytics</p>
                <p><strong>YouTube:</strong> Required for YouTube Shorts posting</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { key: 'postNotifications' as keyof NotificationSettings, title: 'Post Notifications', desc: 'Get notified when posts are published or fail' },
                { key: 'analyticsReports' as keyof NotificationSettings, title: 'Analytics Reports', desc: 'Weekly performance summaries' },
                { key: 'securityAlerts' as keyof NotificationSettings, title: 'Security Alerts', desc: 'Login attempts and security events' },
                { key: 'emailNotifications' as keyof NotificationSettings, title: 'Email Notifications', desc: 'Receive notifications via email' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-500">{setting.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications[setting.key]}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}

              <div className="pt-4">
                <button 
                  onClick={saveUserSettings}
                  disabled={saving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
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
    <Layout title="Settings">
      <SettingsContent />
    </Layout>
  )
} 