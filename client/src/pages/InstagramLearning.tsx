import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface SyncStatus {
  lastSync?: string;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  postsAnalyzed?: number;
  insights?: string[];
}

interface StyleAnalysis {
  dominantTone: string;
  averageWordCount: number;
  commonPhrases: string[];
  topPerformingThemes: string[];
  engagementTriggers: string[];
  bestPostingTimes: string[];
  hashtagPerformance: { hashtag: string; performance: number }[];
}

interface GeneratedCaption {
  id: string;
  caption: string;
  confidence: number;
  hashtags: string[];
  styleMatch: number;
  createdAt: string;
}

interface HashtagAnalysis {
  topPerforming: { hashtag: string; usage: number; avgEngagement: number }[];
  underperforming: { hashtag: string; usage: number; avgEngagement: number }[];
  recommendations: string[];
  trendingHashtags: string[];
}

interface Approval {
  id: string;
  caption: string;
  hashtags: string[];
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  videoId?: string;
  scheduledTime?: string;
  createdAt: string;
}

interface Video {
  id: string;
  title: string;
  duration?: number;
  category: string;
}

interface SyncSettings {
  postCount: number;
  includeStories: boolean;
  includeReels: boolean;
  includePosts: boolean;
}

interface CaptionForm {
  videoId: string;
  prompt: string;
  tone: 'professional' | 'casual' | 'funny' | 'inspirational';
  includeHashtags: boolean;
  maxLength: number;
}

const InstagramLearning: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { user, token } = authContext || {};
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('sync');
  
  // State for different sections
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [styleAnalysis, setStyleAnalysis] = useState<StyleAnalysis | null>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>([]);
  const [hashtagAnalysis, setHashtagAnalysis] = useState<HashtagAnalysis | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  // Form states
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    postCount: 50,
    includeStories: false,
    includeReels: true,
    includePosts: true
  });

  const [captionForm, setCaptionForm] = useState<CaptionForm>({
    videoId: '',
    prompt: '',
    tone: 'professional',
    includeHashtags: true,
    maxLength: 2200
  });

  const fetchSyncStatus = useCallback(async (): Promise<void> => {
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

  const fetchStyleAnalysis = useCallback(async (): Promise<void> => {
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

  const fetchHashtagAnalysis = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/instagram-learning/hashtag-analysis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setHashtagAnalysis(data);
    } catch (err) {
      console.error('Failed to fetch hashtag analysis:', err);
    }
  }, [token]);

  const fetchApprovals = useCallback(async (): Promise<void> => {
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

  const fetchVideos = useCallback(async (): Promise<void> => {
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

  useEffect(() => {
    if (token) {
      fetchSyncStatus();
      fetchStyleAnalysis();
      fetchHashtagAnalysis();
      fetchApprovals();
      fetchVideos();
    }
  }, [token, fetchSyncStatus, fetchStyleAnalysis, fetchHashtagAnalysis, fetchApprovals, fetchVideos]);

  const handleSync = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/instagram-learning/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(syncSettings)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Instagram sync completed successfully!');
        await fetchSyncStatus();
        await fetchStyleAnalysis();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      setError('Failed to sync Instagram data');
      console.error('Sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCaption = async (): Promise<void> => {
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
      
      if (data.success) {
        setGeneratedCaptions(prev => [...prev, data.data]);
        setSuccess('Caption generated successfully!');
      } else {
        setError(data.error || 'Caption generation failed');
      }
    } catch (err) {
      setError('Failed to generate caption');
      console.error('Caption generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, action: 'approve' | 'reject'): Promise<void> => {
    try {
      const response = await fetch(`/api/instagram-learning/approvals/${approvalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          approved: action === 'approve',
          action
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setApprovals(prev => prev.map(approval => 
          approval.id === approvalId 
            ? { ...approval, status: action === 'approve' ? 'approved' : 'rejected' }
            : approval
        ));
        setSuccess(`Caption ${action}d successfully!`);
      } else {
        setError(data.error || `Failed to ${action} caption`);
      }
    } catch (err) {
      setError(`Failed to ${action} caption`);
      console.error('Approval error:', err);
    }
  };

  const clearMessages = (): void => {
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please log in to access Instagram Learning</h2>
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🧠 Instagram Learning AI
        </h1>
        <p className="text-gray-600 mb-8">
          Analyze your Instagram content to learn your style and generate personalized captions
        </p>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button onClick={clearMessages} className="ml-2 text-red-500 hover:text-red-700">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
            <button onClick={clearMessages} className="ml-2 text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'sync', label: 'Sync & Analysis' },
              { id: 'generate', label: 'Generate Captions' },
              { id: 'hashtags', label: 'Hashtag Analysis' },
              { id: 'approvals', label: 'Approvals' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

        {/* Tab Content */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            {/* Sync Settings */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sync Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of posts to analyze
                  </label>
                  <input
                    type="number"
                    value={syncSettings.postCount}
                    onChange={(e) => setSyncSettings(prev => ({ ...prev, postCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="10"
                    max="200"
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncSettings.includePosts}
                      onChange={(e) => setSyncSettings(prev => ({ ...prev, includePosts: e.target.checked }))}
                      className="mr-2"
                    />
                    Include Posts
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncSettings.includeReels}
                      onChange={(e) => setSyncSettings(prev => ({ ...prev, includeReels: e.target.checked }))}
                      className="mr-2"
                    />
                    Include Reels
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={syncSettings.includeStories}
                      onChange={(e) => setSyncSettings(prev => ({ ...prev, includeStories: e.target.checked }))}
                      className="mr-2"
                    />
                    Include Stories
                  </label>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={loading}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Start Sync'}
              </button>
            </div>

            {/* Sync Status */}
            {syncStatus && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sync Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status: 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        syncStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                        syncStatus.status === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
                        syncStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {syncStatus.status}
                      </span>
                    </p>
                    {syncStatus.lastSync && (
                      <p className="text-sm text-gray-600 mt-2">
                        Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                      </p>
                    )}
                    {syncStatus.postsAnalyzed && (
                      <p className="text-sm text-gray-600 mt-2">
                        Posts analyzed: {syncStatus.postsAnalyzed}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Style Analysis */}
            {styleAnalysis && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Content Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Dominant Tone</p>
                    <p className="text-lg font-semibold text-gray-800">{styleAnalysis.dominantTone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Word Count</p>
                    <p className="text-lg font-semibold text-gray-800">{styleAnalysis.averageWordCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Top Themes</p>
                    <p className="text-sm text-gray-800">{styleAnalysis.topPerformingThemes.join(', ')}</p>
                  </div>
                </div>
                
                {styleAnalysis.commonPhrases.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Common Phrases</p>
                    <div className="flex flex-wrap gap-2">
                      {styleAnalysis.commonPhrases.slice(0, 10).map((phrase, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Caption Generation Form */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Personalized Caption</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Video
                  </label>
                  <select
                    value={captionForm.videoId}
                    onChange={(e) => setCaptionForm(prev => ({ ...prev, videoId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a video...</option>
                    {videos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.title} ({video.category})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Description
                  </label>
                  <textarea
                    value={captionForm.prompt}
                    onChange={(e) => setCaptionForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Describe the property or content..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone
                    </label>
                    <select
                      value={captionForm.tone}
                      onChange={(e) => setCaptionForm(prev => ({ ...prev, tone: e.target.value as CaptionForm['tone'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="funny">Funny</option>
                      <option value="inspirational">Inspirational</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Length
                    </label>
                    <input
                      type="number"
                      value={captionForm.maxLength}
                      onChange={(e) => setCaptionForm(prev => ({ ...prev, maxLength: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="100"
                      max="2200"
                    />
                  </div>

                  <div className="flex items-center mt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={captionForm.includeHashtags}
                        onChange={(e) => setCaptionForm(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                        className="mr-2"
                      />
                      Include Hashtags
                    </label>
                  </div>
                </div>

                <button
                  onClick={generateCaption}
                  disabled={loading || !captionForm.prompt}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Caption'}
                </button>
              </div>
            </div>

            {/* Generated Captions */}
            {generatedCaptions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Generated Captions</h3>
                {generatedCaptions.map((caption) => (
                  <div key={caption.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-600">
                        Confidence: {caption.confidence}% | Style Match: {caption.styleMatch}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(caption.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-800 mb-3">{caption.caption}</p>
                    {caption.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {caption.hashtags.map((hashtag, index) => (
                          <span key={index} className="text-blue-600 text-sm">
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div className="space-y-6">
            {hashtagAnalysis && (
              <>
                {/* Top Performing Hashtags */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Hashtags</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hashtagAnalysis.topPerforming.slice(0, 9).map((hashtag, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <p className="font-medium text-gray-800">{hashtag.hashtag}</p>
                        <p className="text-sm text-gray-600">
                          Used {hashtag.usage} times | Avg: {hashtag.avgEngagement.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {hashtagAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Caption Approvals</h3>
            {approvals.length > 0 ? (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <div key={approval.id} className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                          approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {approval.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          Confidence: {approval.confidence}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(approval.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 mb-3">{approval.caption}</p>
                    
                    {approval.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {approval.hashtags.map((hashtag, index) => (
                          <span key={index} className="text-blue-600 text-sm">
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    )}

                    {approval.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(approval.id, 'approve')}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproval(approval.id, 'reject')}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending approvals</p>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
  };
  
  export default InstagramLearning; 