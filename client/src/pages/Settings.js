import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    postingSchedule: {
      enabled: true,
      postsPerDay: 3,
      preferredTimes: ['09:00', '14:00', '19:00'],
      timezone: 'America/Chicago',
    },
    platforms: {
      instagram: { connected: false, username: '' },
      tiktok: { connected: false, username: '' },
      youtube: { connected: false, username: '' },
    },
    notifications: {
      email: true,
      push: true,
      postSuccess: true,
      postFailure: true,
      lowContent: true,
    },
    content: {
      autoGenerateCaptions: true,
      useTrendingHashtags: true,
      includeLocation: true,
      watermark: false,
    },
  });

  const [apiKeys, setApiKeys] = useState([]);
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' });
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [platformStatus, setPlatformStatus] = useState({});
  const [testingConnection, setTestingConnection] = useState({});

  useEffect(() => {
    fetchSettings();
    fetchApiKeys();
    fetchPlatformStatus();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    setLoading(false);
  };

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/api-keys', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) {
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchPlatformStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/platforms/status', {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) {
        setPlatformStatus(data);
      }
    } catch (error) {
      console.error('Error fetching platform status:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert('✅ Settings saved successfully!');
      } else {
        alert('❌ Failed to save settings');
      }
    } catch (error) {
      alert('❌ Error saving settings: ' + error.message);
    }
    setSaving(false);
  };

  const handleAddApiKey = async () => {
    if (!newApiKey.name || !newApiKey.key) {
      alert('Please enter both key name and value');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(newApiKey)
      });
      
      if (response.ok) {
        alert('✅ API key saved successfully!');
        setNewApiKey({ name: '', key: '' });
        setShowApiKeyForm(false);
        fetchApiKeys();
      } else {
        alert('❌ Failed to save API key');
      }
    } catch (error) {
      alert('❌ Error saving API key: ' + error.message);
    }
  };

  const handleConnectPlatform = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/oauth/${platform}/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Open OAuth window
        const authWindow = window.open(
          data.authUrl,
          'oauth',
          'width=600,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            // Refresh platform status
            setTimeout(() => {
              fetchPlatformStatus();
              alert(`✅ ${platform} connection initiated! Check if authorization was successful.`);
            }, 1000);
          }
        }, 1000);
      } else {
        alert(`❌ Failed to initiate ${platform} connection: ` + data.message);
      }
    } catch (error) {
      alert(`❌ Error connecting to ${platform}: ` + error.message);
    }
  };

  const handleDisconnectPlatform = async (platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/oauth/${platform}/disconnect`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      
      if (response.ok) {
        alert(`✅ ${platform} disconnected successfully!`);
        fetchPlatformStatus();
      } else {
        alert(`❌ Failed to disconnect ${platform}`);
      }
    } catch (error) {
      alert(`❌ Error disconnecting ${platform}: ` + error.message);
    }
  };

  const handleTestConnection = async (platform) => {
    setTestingConnection(prev => ({ ...prev, [platform]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/oauth/${platform}/test`, {
        method: 'POST',
        headers: { 'x-auth-token': token }
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${platform} connection test successful!`);
      } else {
        alert(`❌ ${platform} connection test failed: ` + data.error);
      }
    } catch (error) {
      alert(`❌ Error testing ${platform} connection: ` + error.message);
    }
    
    setTestingConnection(prev => ({ ...prev, [platform]: false }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">⚙️ Settings</h1>
          <p className="text-gray-400">Configure your auto-posting preferences and API connections</p>
        </div>

        <div className="space-y-8">
          {/* Platform Connections */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">🔗 Platform Connections</h2>
            
            <div className="space-y-4">
              {['instagram', 'tiktok', 'youtube'].map(platform => (
                <div key={platform} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">
                      {platform === 'instagram' ? '📷' : platform === 'tiktok' ? '🎵' : '📹'}
                    </span>
                    <div>
                      <h3 className="font-semibold capitalize">{platform}</h3>
                      <p className="text-sm text-gray-400">
                        {platformStatus[platform]?.connected 
                          ? `Connected as @${platformStatus[platform]?.username || 'user'}`
                          : 'Not connected'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {platformStatus[platform]?.connected ? (
                      <>
                        <button
                          onClick={() => handleTestConnection(platform)}
                          disabled={testingConnection[platform]}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          {testingConnection[platform] ? <LoadingSpinner size="sm" /> : <span>🔍</span>}
                          <span>Test</span>
                        </button>
                        <button
                          onClick={() => handleDisconnectPlatform(platform)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnectPlatform(platform)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Keys Management */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔑 API Keys</h2>
              <button
                onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {showApiKeyForm ? 'Cancel' : '+ Add Key'}
              </button>
            </div>

            {showApiKeyForm && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Key Name</label>
                    <select
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select API Key Type</option>
                      <option value="OpenAI">OpenAI (GPT-4)</option>
                      <option value="Instagram">Instagram Graph API</option>
                      <option value="TikTok">TikTok API</option>
                      <option value="YouTube">YouTube Data API</option>
                      <option value="Custom">Custom API Key</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <input
                      type="password"
                      value={newApiKey.key}
                      onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="Enter your API key"
                      className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddApiKey}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Save API Key
                </button>
              </div>
            )}

            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No API keys configured</p>
              ) : (
                apiKeys.map((key, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{key.name}</h3>
                      <p className="text-sm text-gray-400">
                        {key.configured ? '✅ Configured' : '❌ Not configured'} • {key.masked}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this API key?')) {
                          // Implement delete functionality
                          alert('Delete functionality would be implemented here');
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Posting Schedule */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">📅 Posting Schedule</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.postingSchedule.enabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    postingSchedule: { ...prev.postingSchedule, enabled: e.target.checked }
                  }))}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label className="text-lg">Enable Auto-Posting</label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Posts Per Day</label>
                  <select
                    value={settings.postingSchedule.postsPerDay}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      postingSchedule: { ...prev.postingSchedule, postsPerDay: parseInt(e.target.value) }
                    }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 Post</option>
                    <option value={2}>2 Posts</option>
                    <option value={3}>3 Posts</option>
                    <option value={4}>4 Posts</option>
                    <option value={5}>5 Posts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={settings.postingSchedule.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      postingSchedule: { ...prev.postingSchedule, timezone: e.target.value }
                    }))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Posting Times</label>
                <div className="grid grid-cols-3 gap-2">
                  {settings.postingSchedule.preferredTimes.map((time, idx) => (
                    <input
                      key={idx}
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...settings.postingSchedule.preferredTimes];
                        newTimes[idx] = e.target.value;
                        setSettings(prev => ({
                          ...prev,
                          postingSchedule: { ...prev.postingSchedule, preferredTimes: newTimes }
                        }));
                      }}
                      className="p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">📝 Content Settings</h2>
            
            <div className="space-y-4">
              {[
                { key: 'autoGenerateCaptions', label: 'Auto-generate captions with AI', icon: '🤖' },
                { key: 'useTrendingHashtags', label: 'Use trending hashtags', icon: '#️⃣' },
                { key: 'includeLocation', label: 'Include location tags', icon: '📍' },
                { key: 'watermark', label: 'Add watermark to videos', icon: '©️' }
              ].map(setting => (
                <div key={setting.key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.content[setting.key]}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, [setting.key]: e.target.checked }
                    }))}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xl">{setting.icon}</span>
                  <label>{setting.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">🔔 Notifications</h2>
            
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email notifications', icon: '📧' },
                { key: 'push', label: 'Push notifications', icon: '📱' },
                { key: 'postSuccess', label: 'Notify on successful posts', icon: '✅' },
                { key: 'postFailure', label: 'Notify on post failures', icon: '❌' },
                { key: 'lowContent', label: 'Notify when content is low', icon: '⚠️' }
              ].map(setting => (
                <div key={setting.key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications[setting.key]}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, [setting.key]: e.target.checked }
                    }))}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xl">{setting.icon}</span>
                  <label>{setting.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <span>💾</span>}
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 