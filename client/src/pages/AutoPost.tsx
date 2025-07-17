import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const DEFAULT_CAMERA_ROLL_PATH = '/Users/peterallen/Pictures';

interface Status {
  enabled: boolean;
  cameraRollPath: string;
  postingTimes: string[];
  nextPostTime: string;
}

interface ScanResults {
  totalVideos: number;
  selectedVideos: ScanVideo[];
  message: string;
}

interface ScanVideo {
  name: string;
  duration: number;
  size: string;
  resolution: string;
  aiScore: number;
  instagramStatus: string;
}

interface CartoonStats {
  totalCartoons: number;
  recentCartoons: any[];
}

interface InstagramStatus {
  connected: boolean;
  setupInstructions?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  note?: string;
}

interface VideoStats {
  totalVideos: number;
  totalPosts: number;
  avgPostsPerVideo: number;
  unpostedVideos: number;
  readyToRepost: number;
}

interface NextVideo {
  id: number;
  title: string;
  duration?: number;
  postCount: number;
  lastPosted?: string;
  description?: string;
}

// Extend Window interface for directory picker
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

const AutoPost: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<ScanResults | null>(null);
  const [cameraRollPath, setCameraRollPath] = useState<string>('');
  const [cartoonStatus, setCartoonStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [cartoonMessage, setCartoonMessage] = useState<string>('');
  const [cartoonStats, setCartoonStats] = useState<CartoonStats>({ totalCartoons: 0, recentCartoons: [] });
  const [instagramStatus, setInstagramStatus] = useState<InstagramStatus | null>(null);
  const [videoStats, setVideoStats] = useState<VideoStats | null>(null);
  const [nextVideo, setNextVideo] = useState<NextVideo | null>(null);

  useEffect(() => {
    fetchStatus();
    loadCartoonStats();
    fetchInstagramStatus();
    fetchVideoStats();
    fetchNextVideo();
  }, []);

  const fetchStatus = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/autopost/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const enableAutoPosting = async (): Promise<void> => {
    try {
      await axios.post('/api/autopost/enable', {
        cameraRollPath: DEFAULT_CAMERA_ROLL_PATH,
        postingTimes: ['09:00', '12:00', '18:00']
      });
      
      toast.success('Auto-posting enabled!');
      fetchStatus();
    } catch (error) {
      toast.error('Failed to enable auto-posting');
      console.error('Error enabling auto-posting:', error);
    }
  };

  const disableAutoPosting = async (): Promise<void> => {
    try {
      await axios.post('/api/autopost/disable');
      toast.success('Auto-posting disabled');
      fetchStatus();
    } catch (error) {
      toast.error('Failed to disable auto-posting');
      console.error('Error disabling auto-posting:', error);
    }
  };

  const testScan = async (): Promise<void> => {
    setIsScanning(true);
    try {
      const response = await axios.post('/api/autopost/test-scan');
      setScanResults(response.data);
      toast.success(`Found ${response.data.totalVideos} videos, ${response.data.selectedVideos.length} selected`);
    } catch (error) {
      toast.error('Failed to scan camera roll');
      console.error('Error scanning camera roll:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const scanAndPrepare = async (): Promise<void> => {
    setIsScanning(true);
    try {
      const response = await axios.post('/api/autopost/scan-camera-roll', {
        targetCount: 3
      });
      toast.success(`Prepared ${response.data.videos.length} videos for auto-posting`);
      fetchStatus();
    } catch (error) {
      toast.error('Failed to prepare videos');
      console.error('Error preparing videos:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const manualPost = async (): Promise<void> => {
    setIsPosting(true);
    try {
      await axios.post('/api/autopost/manual-post');
      toast.success('Manual post completed!');
    } catch (error) {
      toast.error('Failed to post manually');
      console.error('Error manual posting:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateCartoon = async (): Promise<void> => {
    setCartoonStatus('creating');
    setCartoonMessage('Creating funny real estate cartoon...');
    
    try {
      const { data } = await axios.post('/api/autopost/create-cartoon');
      
      setCartoonStatus('success');
      setCartoonMessage(`Cartoon created: "${data.cartoon.title}" - ${data.cartoon.duration}s`);
      loadCartoonStats();
      setTimeout(() => {
        setCartoonStatus('idle');
        setCartoonMessage('');
      }, 5000);
    } catch (error) {
      setCartoonStatus('error');
      setCartoonMessage('Network error while creating cartoon');
    }
  };

  const loadCartoonStats = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/autopost/cartoon-stats');
      if (response.status === 200) {
        setCartoonStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load cartoon stats:', error);
    }
  };

  const fetchInstagramStatus = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/autopost/instagram-status');
      setInstagramStatus(response.data);
    } catch (error) {
      console.error('Error fetching Instagram status:', error);
    }
  };

  const fetchVideoStats = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/autopost/video-stats');
      setVideoStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching video stats:', error);
    }
  };

  const fetchNextVideo = async (): Promise<void> => {
    try {
      const response = await axios.get('/api/autopost/next-video');
      setNextVideo(response.data.video);
    } catch (error) {
      console.error('Error fetching next video:', error);
      setNextVideo(null);
    }
  };

  const handleSelectCameraRoll = async (): Promise<void> => {
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        setCameraRollPath(dirHandle.name);
        toast.success(`Camera roll folder set: ${dirHandle.name}`);
        await axios.post('/api/autopost/set-camera-roll-path', { cameraRollPath: dirHandle.name });
        fetchStatus();
      } catch (err) {
        toast.error('Folder selection cancelled or failed');
      }
    } else {
      toast.error('Your browser does not support folder selection. Please use Chrome or Edge.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-black mb-6">
          🤖 AI Auto-Posting System
        </h1>
        <div className="mb-4 text-yellow-700 font-semibold">
          <button
            onClick={handleSelectCameraRoll}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mb-2"
          >
            Connect Camera Roll / Select Video Folder
          </button>
          {cameraRollPath && (
            <div className="text-black mt-2">Current folder: {cameraRollPath}</div>
          )}
          <div>The app will automatically sync with your selected folder. All new videos and photos will be scanned automatically.</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              📊 Auto-Posting Status
            </h2>
            
            {status && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    status.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {status.enabled ? '🟢 Enabled' : '🔴 Disabled'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium">Camera Roll Path:</span>
                  <p className="text-sm text-black mt-1">{status.cameraRollPath}</p>
                </div>
                
                <div>
                  <span className="font-medium">Posting Times:</span>
                  <p className="text-sm text-black mt-1">
                    {status.postingTimes?.join(', ') || '09:00, 12:00, 18:00'}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium">Next Post:</span>
                  <p className="text-sm text-black mt-1">{status.nextPostTime}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Card */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              🎛️ Controls
            </h2>
            
            <div className="space-y-4">
              <div className="flex space-x-3">
                {status?.enabled ? (
                  <button
                    onClick={disableAutoPosting}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    🛑 Disable Auto-Posting
                  </button>
                ) : (
                  <button
                    onClick={enableAutoPosting}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    🚀 Enable Auto-Posting
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Status */}
        {instagramStatus && (
          <div className="mt-6 bg-purple-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">
              📱 Instagram Connection Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="font-medium">Connection:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  instagramStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {instagramStatus.connected ? '🟢 Connected' : '🟡 Setup Required'}
                </span>
              </div>
              
              {!instagramStatus.connected && instagramStatus.setupInstructions && (
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3">Setup Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>{instagramStatus.setupInstructions.step1}</li>
                    <li>{instagramStatus.setupInstructions.step2}</li>
                    <li>{instagramStatus.setupInstructions.step3}</li>
                    <li>{instagramStatus.setupInstructions.step4}</li>
                  </ol>
                  {instagramStatus.note && (
                    <p className="mt-3 text-sm text-purple-700 font-medium">
                      💡 {instagramStatus.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Management Status */}
        <div className="mt-6 bg-orange-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-orange-900 mb-4">
            🏠 Real Estate Video Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Stats */}
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3">📊 Video Statistics</h3>
              {videoStats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Videos:</span>
                    <span className="font-semibold">{videoStats.totalVideos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Posts:</span>
                    <span className="font-semibold">{videoStats.totalPosts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Posts/Video:</span>
                    <span className="font-semibold">{videoStats.avgPostsPerVideo?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unposted Videos:</span>
                    <span className="font-semibold text-green-600">{videoStats.unpostedVideos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ready to Repost:</span>
                    <span className="font-semibold text-blue-600">{videoStats.readyToRepost}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading stats...</p>
              )}
            </div>

            {/* Next Video */}
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-3">🎯 Next Video for Posting</h3>
              {nextVideo ? (
                <div className="space-y-2 text-sm">
                  <div className="font-semibold text-gray-800">{nextVideo.title}</div>
                  <div className="text-gray-600">
                    Duration: {nextVideo.duration ? `${Math.round(nextVideo.duration)}s` : 'Unknown'}
                  </div>
                  <div className="text-gray-600">
                    Posted: {nextVideo.postCount || 0} times
                  </div>
                  <div className="text-gray-600">
                    Last posted: {nextVideo.lastPosted ? new Date(nextVideo.lastPosted).toLocaleDateString() : 'Never'}
                  </div>
                  {nextVideo.description && (
                    <div className="text-gray-600">
                      Caption: {nextVideo.description.substring(0, 50)}...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">
                  <p>No videos available for posting</p>
                  <p className="text-xs mt-1">Upload more videos or wait for 7-day cooldown</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => window.location.href = '/videos'}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              📹 Manage Videos
            </button>
            <button
              onClick={fetchNextVideo}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Next Video
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-black mb-4">
            🎯 Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={testScan}
              disabled={isScanning}
              className="btn-primary disabled:opacity-50"
            >
              {isScanning ? '🔍 Scanning...' : '🔍 Test Scan Camera Roll'}
            </button>
            
            <button
              onClick={scanAndPrepare}
              disabled={isScanning}
              className="btn-secondary disabled:opacity-50"
            >
              {isScanning ? '📱 Preparing...' : '📱 Scan & Prepare Videos'}
            </button>
            
            <button
              onClick={manualPost}
              disabled={isPosting}
              className="btn-primary disabled:opacity-50"
            >
              {isPosting ? '🚀 Posting...' : '🚀 Manual Post Now'}
            </button>

            <button
              onClick={handleCreateCartoon}
              disabled={cartoonStatus === 'creating'}
              className="btn-secondary disabled:opacity-50"
            >
              {cartoonStatus === 'creating' ? '🎨 Creating...' : '🎨 Create Cartoon'}
            </button>
          </div>

          {/* Cartoon Status */}
          {cartoonMessage && (
            <div className={`mt-4 p-3 rounded-md ${
              cartoonStatus === 'success' ? 'bg-green-100 text-green-800' :
              cartoonStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {cartoonMessage}
            </div>
          )}
        </div>

        {/* Scan Results */}
        {scanResults && (
          <div className="mt-8 bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              📊 Scan Results
            </h2>
            
            <div className="mb-4">
              <p className="text-black">
                {scanResults.message}
              </p>
            </div>
            
            {scanResults.selectedVideos && scanResults.selectedVideos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resolution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Instagram Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scanResults.selectedVideos.map((video, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                          {video.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {Math.round(video.duration)}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {video.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {video.resolution}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          <span className={`px-2 py-1 rounded text-xs ${
                            video.aiScore >= 8 ? 'bg-green-100 text-green-800' :
                            video.aiScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {video.aiScore}/10
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {video.instagramStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-black mb-4">
            ℹ️ How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Target Audience</h3>
              <ul className="text-sm text-black space-y-1">
                <li>• Buyers looking to purchase within 30-90 days</li>
                <li>• Active homebuyers in your market</li>
                <li>• Investors seeking opportunities</li>
                <li>• First-time homebuyers</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🤖 AI Features</h3>
              <ul className="text-sm text-black space-y-1">
                <li>• Scans camera roll for videos with audio</li>
                <li>• AI-selects best content for buyer audience</li>
                <li>• Generates buyer-focused captions & hashtags</li>
                <li>• Posts 3 times daily at optimal viral times</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instagram Caption Reuse Section */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-4">
            📱 Instagram Caption Reuse
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-800 mb-2">🔄 Smart Caption Reuse</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Checks if video already exists on Instagram</li>
                <li>• Extracts existing caption (without hashtags)</li>
                <li>• Generates new viral hashtags for better reach</li>
                <li>• Avoids duplicate posts while optimizing engagement</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-800 mb-2">🚀 Viral Hashtag Generation</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• AI analyzes existing caption content</li>
                <li>• Generates 20-25 trending hashtags</li>
                <li>• Targets active buyers and investors</li>
                <li>• Optimizes for Instagram algorithm</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h4 className="font-semibold text-green-800 mb-2">💡 Example Process:</h4>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>1.</strong> System finds video already posted on Instagram</p>
              <p><strong>2.</strong> Extracts: "🏠 Beautiful 3BR home in prime location! Perfect for families or investors. Don't miss this opportunity!"</p>
              <p><strong>3.</strong> Generates new viral hashtags: #RealEstate #HomeBuying #Investment #DreamHome #BuyNow #PropertyInvestment #RealEstateInvesting #HomeBuyers #BuyerMarket #RealEstateTips #PropertyShowcase #InvestmentProperty #HomeBuyingTips #RealEstateAgent #Property #HouseHunting #RealEstateInvesting #HomeInvestment #BuyerMarket #RealEstateTips #PropertyInvestment #HomeBuyers #RealEstateAgent #PropertyShowcase #InvestmentProperty #HomeBuyingTips</p>
              <p><strong>4.</strong> Posts with existing caption + new viral hashtags for maximum reach!</p>
            </div>
          </div>
        </div>

        {/* Cartoon System Section */}
        <div className="mt-8 bg-pink-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-pink-900 mb-4">
            🎨 Funny Real Estate Cartoons
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-pink-800 mb-2">🎭 Cartoon Strategy</h3>
              <ul className="text-sm text-pink-700 space-y-1">
                <li>• Creates funny cartoons every other post</li>
                <li>• 15-20 second viral-worthy content</li>
                <li>• Relatable homebuying situations</li>
                <li>• Drives engagement and link clicks</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-pink-800 mb-2">📊 Cartoon Statistics</h3>
              <div className="text-sm text-pink-700 space-y-2">
                <p><strong>Total Cartoons Created:</strong> {cartoonStats.totalCartoons}</p>
                <p><strong>Recent Cartoons:</strong></p>
                {cartoonStats.recentCartoons && cartoonStats.recentCartoons.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {cartoonStats.recentCartoons.slice(0, 3).map((cartoon, index) => (
                      <li key={index} className="text-xs">{cartoon}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic">No cartoons created yet</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h4 className="font-semibold text-pink-800 mb-2">🎬 Cartoon Topics:</h4>
            <div className="text-sm text-pink-700 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Buyer stress during house hunting</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Mortgage approval drama</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">House inspection surprises</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Closing day chaos</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">First-time buyer mistakes</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Moving day disasters</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Neighbor meet-cute</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Market FOMO situations</span>
                <span className="px-2 py-1 bg-pink-100 rounded text-xs">Investor dreams vs reality</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg border">
            <h4 className="font-semibold text-pink-800 mb-2">💡 How Cartoons Drive Engagement:</h4>
            <div className="text-sm text-pink-700 space-y-2">
              <p><strong>1.</strong> <strong>Variety:</strong> Alternates between real videos and funny cartoons to keep content fresh</p>
              <p><strong>2.</strong> <strong>Relatability:</strong> Every buyer has experienced these funny situations</p>
              <p><strong>3.</strong> <strong>Shareability:</strong> Humor makes content go viral and reach more potential buyers</p>
              <p><strong>4.</strong> <strong>Call-to-Action:</strong> Each cartoon ends with a funny reason to check your link</p>
              <p><strong>5.</strong> <strong>Brand Building:</strong> Shows your personality and makes you memorable to buyers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoPost; 