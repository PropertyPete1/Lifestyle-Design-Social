import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const InstagramLearning = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('sync');
  
  // State for different sections
  const [syncStatus, setSyncStatus] = useState(null);
  const [styleAnalysis, setStyleAnalysis] = useState(null);
  const [generatedCaptions, setGeneratedCaptions] = useState([]);
  const [hashtagAnalysis, setHashtagAnalysis] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [videos, setVideos] = useState([]);

  // Form states
  const [syncSettings, setSyncSettings] = useState({
    postCount: 50,
    includeStories: false,
    includeReels: true,
    includePosts: true
  });

  const [captionForm, setCaptionForm] = useState({
    videoId: '',
    prompt: '',
    tone: 'professional',
    includeHashtags: true,
    maxLength: 2200
  });

  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/instagram-learning/sync-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSyncStatus(data);
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  }, [token]);

  const fetchStyleAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/instagram-learning/style-analysis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStyleAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch style analysis:', err);
    }
  }, [token]);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/videos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  }, [token]);

  const fetchApprovals = useCallback(async () => {
    try {
      const response = await fetch('/api/instagram-learning/approvals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    }
  }, [token]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSyncStatus(),
        fetchStyleAnalysis(),
        fetchVideos(),
        fetchApprovals()
      ]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchSyncStatus, fetchStyleAnalysis, fetchVideos, fetchApprovals]);

  useEffect(() => {
    if (user && token) {
      fetchInitialData();
    }
  }, [user, token, fetchInitialData]);

  const handleSync = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/instagram-learning/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(syncSettings)
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Successfully synced ${data.postsAnalyzed} posts from Instagram`);
        await fetchSyncStatus();
        await fetchStyleAnalysis();
      } else {
        setError(data.error || 'Failed to sync Instagram posts');
      }
    } catch (err) {
      setError('Network error while syncing Instagram posts');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/instagram-learning/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(captionForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        setGeneratedCaptions(prev => [data.caption, ...prev]);
        setSuccess('Caption generated successfully!');
      } else {
        setError(data.error || 'Failed to generate caption');
      }
    } catch (err) {
      setError('Network error while generating caption');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/instagram-learning/hashtag-analysis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setHashtagAnalysis(data);
    } catch (err) {
      setError('Failed to analyze hashtags');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId, action, feedback = '') => {
    try {
      const response = await fetch(`/api/instagram-learning/approvals/${approvalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, feedback })
      });

      if (response.ok) {
        setSuccess(`Caption ${action}d successfully`);
        await fetchApprovals();
      } else {
        setError('Failed to process approval');
      }
    } catch (err) {
      setError('Network error while processing approval');
    }
  };

  const renderSyncTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Instagram Sync Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Posts to Analyze
            </label>
            <input
              type="number"
              value={syncSettings.postCount}
              onChange={(e) => setSyncSettings({...syncSettings, postCount: parseInt(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="10"
              max="100"
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.includePosts}
                onChange={(e) => setSyncSettings({...syncSettings, includePosts: e.target.checked})}
                className="mr-2"
              />
              Include Feed Posts
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.includeReels}
                onChange={(e) => setSyncSettings({...syncSettings, includeReels: e.target.checked})}
                className="mr-2"
              />
              Include Reels
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={syncSettings.includeStories}
                onChange={(e) => setSyncSettings({...syncSettings, includeStories: e.target.checked})}
                className="mr-2"
              />
              Include Stories
            </label>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Sync Instagram Posts'}
        </button>
      </div>

      {syncStatus && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sync Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncStatus.totalPosts}</div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{syncStatus.analyzedPosts}</div>
              <div className="text-sm text-gray-600">Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{syncStatus.avgEngagement}</div>
              <div className="text-sm text-gray-600">Avg Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{syncStatus.topPerformingCount}</div>
              <div className="text-sm text-gray-600">Top Performers</div>
            </div>
          </div>
        </div>
      )}

      {styleAnalysis && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Your Writing Style Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Dominant Tone</h4>
              <p className="text-lg text-blue-600 font-semibold">{styleAnalysis.dominantTone}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Average Word Count</h4>
              <p className="text-lg text-green-600 font-semibold">{styleAnalysis.averageWordCount} words</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Top Themes</h4>
              <div className="flex flex-wrap gap-2">
                {styleAnalysis.topPerformingThemes?.map((theme, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Engagement Triggers</h4>
              <div className="flex flex-wrap gap-2">
                {styleAnalysis.engagementTriggers?.map((trigger, index) => (
                  <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm">
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGenerateTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Generate AI Caption</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video
            </label>
            <select
              value={captionForm.videoId}
              onChange={(e) => setCaptionForm({...captionForm, videoId: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a video...</option>
              {videos.map(video => (
                <option key={video.id} value={video.id}>
                  {video.title || video.fileName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={captionForm.tone}
              onChange={(e) => setCaptionForm({...captionForm, tone: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="funny">Funny</option>
              <option value="inspirational">Inspirational</option>
              <option value="educational">Educational</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Prompt (Optional)
          </label>
          <textarea
            value={captionForm.prompt}
            onChange={(e) => setCaptionForm({...captionForm, prompt: e.target.value})}
            placeholder="Add any specific instructions for the AI..."
            className="w-full p-2 border border-gray-300 rounded-md"
            rows="3"
          />
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={captionForm.includeHashtags}
              onChange={(e) => setCaptionForm({...captionForm, includeHashtags: e.target.checked})}
              className="mr-2"
            />
            Include Hashtags
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Length
            </label>
            <input
              type="number"
              value={captionForm.maxLength}
              onChange={(e) => setCaptionForm({...captionForm, maxLength: parseInt(e.target.value)})}
              className="w-20 p-1 border border-gray-300 rounded-md"
              min="100"
              max="2200"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateCaption}
          disabled={loading || !captionForm.videoId}
          className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>
      </div>

      {generatedCaptions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Generated Captions</h3>
          <div className="space-y-4">
            {generatedCaptions.map((caption, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500">
                    Performance Score: {caption.performanceScore}%
                  </span>
                  <span className="text-sm text-gray-500">
                    Style Match: {caption.styleMatch}%
                  </span>
                </div>
                <p className="text-gray-800 mb-3">{caption.text}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {caption.hashtags?.map((hashtag, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      #{hashtag}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                    Use This Caption
                  </button>
                  <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderHashtagsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Hashtag Performance Analysis</h3>
          <button
            onClick={handleHashtagAnalysis}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Hashtags'}
          </button>
        </div>

        {hashtagAnalysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Top Performing</h4>
                <div className="space-y-2">
                  {hashtagAnalysis.topPerforming?.map((hashtag, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">#{hashtag.tag}</span>
                      <span className="text-sm font-medium text-green-600">
                        {hashtag.avgEngagement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Most Used</h4>
                <div className="space-y-2">
                  {hashtagAnalysis.mostUsed?.map((hashtag, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">#{hashtag.tag}</span>
                      <span className="text-sm font-medium text-blue-600">
                        {hashtag.count} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Trending</h4>
                <div className="space-y-2">
                  {hashtagAnalysis.trending?.map((hashtag, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">#{hashtag.tag}</span>
                      <span className="text-sm font-medium text-orange-600">
                        +{hashtag.growth}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Recommended Hashtag Mix</h4>
              <p className="text-sm text-gray-600 mb-3">
                Based on your performance data, here's the optimal hashtag strategy:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">High-Performance Tags (8-10)</h5>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalysis.recommended?.highPerformance?.map((tag, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Trending Tags (5-7)</h5>
                  <div className="flex flex-wrap gap-1">
                    {hashtagAnalysis.recommended?.trending?.map((tag, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderApprovalsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
        
        {approvals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending approvals</p>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">Video: {approval.videoTitle}</h4>
                    <p className="text-sm text-gray-500">
                      Scheduled for: {new Date(approval.scheduledTime).toLocaleString()}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                    {approval.status}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-800">{approval.caption}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {approval.hashtags?.map((hashtag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      #{hashtag}
                    </span>
                  ))}
                </div>
                
                {approval.prediction && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-sm font-medium">AI Prediction:</p>
                    <p className="text-sm text-gray-600">
                      Expected engagement: {approval.prediction.expectedEngagement}
                    </p>
                    <p className="text-sm text-gray-600">
                      Performance score: {approval.prediction.performanceScore}%
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproval(approval.id, 'approve')}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(approval.id, 'reject')}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval(approval.id, 'edit')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'sync', label: 'Sync & Analyze', component: renderSyncTab },
    { id: 'generate', label: 'Generate Captions', component: renderGenerateTab },
    { id: 'hashtags', label: 'Hashtag Analysis', component: renderHashtagsTab },
    { id: 'approvals', label: 'Approvals', component: renderApprovalsTab }
  ];

  if (loading && !syncStatus && !styleAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Instagram Learning AI</h1>
          <p className="text-gray-600">
            Analyze your Instagram content and generate personalized captions using AI
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="mb-8">
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>
      </div>
    </div>
  );
};

export default InstagramLearning; 