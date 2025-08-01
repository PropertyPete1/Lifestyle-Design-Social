'use client';

import { useState, useEffect } from 'react';

// API configuration
const API_BASE_URL = 'http://localhost:3002/api';

// API helper functions
const api = {
  async get(endpoint: string) {
    console.log(`🔄 GET: ${API_BASE_URL}${endpoint}`);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      console.log(`📡 Response status: ${response.status}`);
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      console.log('✅ GET success:', data);
      return data;
    } catch (error) {
      console.error('❌ GET error:', error);
      throw error;
    }
  },

  async post(endpoint: string, data: Record<string, unknown>) {
    console.log(`🔄 POST: ${API_BASE_URL}${endpoint}`, data);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        mode: 'cors'
      });
      console.log(`📡 Response status: ${response.status}`);
      if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
      const result = await response.json();
      console.log('✅ POST success:', result);
      return result;
    } catch (error) {
      console.error('❌ POST error:', error);
      throw error;
    }
  }
};

export default function Settings() {
  // Form states
  const [instagramToken, setInstagramToken] = useState('');
  const [instagramAccount, setInstagramAccount] = useState('');
  const [facebookPage, setFacebookPage] = useState('');
  const [youtubeToken, setYoutubeToken] = useState('');
  const [youtubeRefresh, setYoutubeRefresh] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [dropboxToken, setDropboxToken] = useState('');
  const [mongodbUri, setMongodbUri] = useState('');
  
  // Optional credentials
  const [runwayApi, setRunwayApi] = useState('');
  const [openaiApi, setOpenaiApi] = useState('');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3Region, setS3Region] = useState('');
  
  // Mode settings
  const [autopilotMode, setAutopilotMode] = useState(false);
  const [manualMode, setManualMode] = useState(true);
  
  // Scheduler settings
  const [postTime, setPostTime] = useState('14:00');
  const [peakHours, setPeakHours] = useState(true);
  const [maxPosts, setMaxPosts] = useState('5');
  const [repostDelay, setRepostDelay] = useState('1');
  
  // Visual settings
  const [thumbnailMode, setThumbnailMode] = useState('first');
  const [editorStyle, setEditorStyle] = useState('simple');
  const [cartoonEnabled, setCartoonEnabled] = useState(true);
  const [postToInstagram, setPostToInstagram] = useState(true);
  const [postToYoutube, setPostToYoutube] = useState(true);
  const [crossPost, setCrossPost] = useState(true);
  
  // Storage settings
  const [dropboxFolder, setDropboxFolder] = useState('/Bulk Upload');
  const [fileRetention, setFileRetention] = useState('7');
  
  // Phase 9 specific settings
  const [minViews, setMinViews] = useState('10000');
  const [trendingAudio, setTrendingAudio] = useState(true);
  const [aiCaptions, setAiCaptions] = useState(true);
  const [dropboxSave, setDropboxSave] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await api.get('/settings');
      if (settings) {
        // Core credentials - using exact MongoDB schema field names
        setInstagramToken(settings.instagramToken || '');
        setInstagramAccount(settings.instagramAccount || '');
        setFacebookPage(settings.facebookPage || '');
        setYoutubeToken(settings.youtubeToken || '');
        setYoutubeRefresh(settings.youtubeRefresh || '');
        setYoutubeChannel(settings.youtubeChannel || '');
        setDropboxToken(settings.dropboxToken || '');
        setMongodbUri(settings.mongodbUri || '');
        
        // Optional credentials
        setRunwayApi(settings.runwayApi || '');
        setOpenaiApi(settings.openaiApi || '');
        setS3AccessKey(settings.s3AccessKey || '');
        setS3SecretKey(settings.s3SecretKey || '');
        setS3Bucket(settings.s3Bucket || '');
        setS3Region(settings.s3Region || '');
        
        // Mode settings
        setAutopilotMode(settings.autopilot || false);
        setManualMode(settings.manual !== false); // Default to true
        
        // Scheduler settings
        setPostTime(settings.postTime || '14:00');
        setPeakHours(settings.peakHours || true);
        setMaxPosts(settings.maxPosts?.toString() || '5');
        setRepostDelay(settings.repostDelay?.toString() || '1');
        
        // Visual settings
        setThumbnailMode(settings.thumbnailMode || 'first');
        setEditorStyle(settings.editorStyle || 'simple');
        setCartoonEnabled(settings.cartoon !== false); // Default to true
        setPostToInstagram(settings.postToInstagram !== false); // Default to true
        setPostToYoutube(settings.postToYouTube !== false); // Default to true
        setCrossPost(settings.crossPost || false);
        
        // Storage settings
        setDropboxFolder(settings.dropboxFolder || '/Bulk Upload');
        setFileRetention(settings.fileRetention?.toString() || '7');
        
        // Phase 9 specific settings
        setMinViews(settings.minViews?.toString() || '10000');
        setTrendingAudio(settings.trendingAudio !== false);
        setAiCaptions(settings.aiCaptions !== false);
        setDropboxSave(settings.dropboxSave || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showNotification('⚠️ Failed to load existing settings');
    }
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

  const toggleMode = (mode: string) => {
    if (mode === 'autopilot') {
      setAutopilotMode(true);
      setManualMode(false);
    } else {
      setManualMode(true);
      setAutopilotMode(false);
    }
  };

  const saveCredentials = async () => {
    try {
      const data = {
        instagramToken,
        instagramAccount,
        facebookPage,
        youtubeToken,
        youtubeRefresh,
        youtubeChannel,
        dropboxToken,
        mongodbUri,
        runwayApi,
        openaiApi,
        s3AccessKey,
        s3SecretKey,
        s3Bucket,
        s3Region,
        autopilot: autopilotMode,
        manual: manualMode,
        postTime,
        peakHours,
        maxPosts: parseInt(maxPosts),
        repostDelay: parseInt(repostDelay),
        thumbnailMode,
        editorStyle,
        cartoon: cartoonEnabled,
        postToInstagram,
        postToYouTube: postToYoutube,
        crossPost,
        dropboxFolder,
        fileRetention: parseInt(fileRetention),
        minViews: parseInt(minViews),
        trendingAudio,
        aiCaptions,
        dropboxSave
      };
      
      await api.post('/settings', data);
      showNotification('✅ All settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('❌ Failed to save settings');
    }
  };

  // All settings now save through the unified saveCredentials function
  const saveOptionalCredentials = saveCredentials;
  const saveModes = saveCredentials;
  const saveScheduler = saveCredentials;
  const saveVisuals = saveCredentials;
  const saveStorage = saveCredentials;

  const cleanupFiles = async () => {
    try {
      showNotification('🗑️ Cleaning up placeholder posts...');
      const result = await api.post('/test/cleanup', {});
      showNotification(`✅ Cleanup completed! ${result.results.filesRemoved} files removed.`);
    } catch (error) {
      console.error('Failed to cleanup files:', error);
      showNotification('❌ Cleanup failed');
    }
  };

  const validateAPIs = async () => {
    try {
      showNotification('🔍 Validating API connections...');
      const result = await api.post('/test/validate-apis', {});
      const { valid, total } = result.summary;
      showNotification(`✅ API validation completed: ${valid}/${total} APIs configured`);
    } catch (error) {
      console.error('Failed to validate APIs:', error);
      showNotification('❌ API validation failed');
    }
  };

  const testMongoDB = async () => {
    try {
      showNotification('☁️ Testing MongoDB connection...');
      const result = await api.post('/test/mongodb', {});
      showNotification(`✅ ${result.message}`);
    } catch (error) {
      console.error('Failed to test MongoDB:', error);
      showNotification('❌ MongoDB test failed');
    }
  };

  const testUpload = async () => {
    try {
      showNotification('📤 Running test upload...');
      const result = await api.post('/test/upload', {});
      showNotification(`✅ ${result.message}`);
    } catch (error) {
      console.error('Failed to test upload:', error);
      showNotification('❌ Upload test failed');
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(34, 197, 94, 0.9);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      animation: slideIn 0.3s ease;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 3000);
  };

  return (
    <div className="settings-container">
      <div className="header">
        <button className="back-btn" onClick={goBack}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Settings</h1>
        <div></div>
      </div>

      <div className="settings-grid">
        {/* Core API Credentials */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🔐</div>
            <h2 className="card-title">Core API Credentials</h2>
          </div>
          
          <div className="form-group">
            <label className="form-label">📸 Instagram Access Token</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Instagram access token..." 
              value={instagramToken}
              onChange={(e) => setInstagramToken(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Enables posting and scraping IG data</small>
          </div>

          <div className="form-group">
            <label className="form-label">📸 IG Business Account ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Business Account ID..." 
              value={instagramAccount}
              onChange={(e) => setInstagramAccount(e.target.value)}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Required for Graph API scraping</small>
          </div>

          <div className="form-group">
            <label className="form-label">📘 Facebook Page ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Facebook Page ID..." 
              value={facebookPage}
              onChange={(e) => setFacebookPage(e.target.value)}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>For IG→FB linkage</small>
          </div>

          <div className="form-group">
            <label className="form-label">📺 YouTube Token</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter YouTube token..." 
              value={youtubeToken}
              onChange={(e) => setYoutubeToken(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Enables posting via YouTube Data API</small>
          </div>

          <div className="form-group">
            <label className="form-label">📺 YouTube Refresh Token</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter YouTube refresh token..." 
              value={youtubeRefresh}
              onChange={(e) => setYoutubeRefresh(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Used to auto-refresh YouTube access</small>
          </div>

          <div className="form-group">
            <label className="form-label">📺 YouTube Channel ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Channel ID..." 
              value={youtubeChannel}
              onChange={(e) => setYoutubeChannel(e.target.value)}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Specifies which channel to post to</small>
          </div>

          <div className="form-group">
            <label className="form-label">📦 Dropbox Token</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Dropbox token..." 
              value={dropboxToken}
              onChange={(e) => setDropboxToken(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Allows syncing and retrieving bulk videos</small>
          </div>

          <div className="form-group">
            <label className="form-label">☁️ MongoDB URI</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="mongodb+srv://username:password@cluster..." 
              value={mongodbUri}
              onChange={(e) => setMongodbUri(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Main DB connection</small>
          </div>

          <button className="btn-primary" onClick={saveCredentials}>Save Core Credentials</button>
        </div>

        {/* Optional API Credentials */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🔧</div>
            <h2 className="card-title">Optional API Credentials</h2>
          </div>
          
          <div className="form-group">
            <label className="form-label">🎨 Runway API Key <span style={{color: '#ff4458'}}>(Optional)</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Runway API key..." 
              value={runwayApi}
              onChange={(e) => setRunwayApi(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Powers cartoon generation if enabled</small>
          </div>

          <div className="form-group">
            <label className="form-label">🤖 OpenAI API Key <span style={{color: '#ff4458'}}>(Optional)</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter OpenAI API key..." 
              value={openaiApi}
              onChange={(e) => setOpenaiApi(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Used to generate or rewrite captions</small>
          </div>

          <div className="form-group">
            <label className="form-label">🪣 S3 Access Key ID <span style={{color: '#ff4458'}}>(Optional)</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter S3 Access Key..." 
              value={s3AccessKey}
              onChange={(e) => setS3AccessKey(e.target.value)}
              style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>If used instead of Dropbox</small>
          </div>

          <div className="form-group">
            <label className="form-label">🪣 S3 Secret Access Key <span style={{color: '#ff4458'}}>(Optional)</span></label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter S3 Secret Key..." 
              value={s3SecretKey}
              onChange={(e) => setS3SecretKey(e.target.value)}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Secret key for S3 bucket access</small>
          </div>

          <div className="form-group">
            <label className="form-label">🪣 S3 Bucket Name <span style={{color: '#ff4458'}}>(Optional)</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="my-video-bucket" 
              value={s3Bucket}
              onChange={(e) => setS3Bucket(e.target.value)}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>Name of your S3 bucket</small>
          </div>

          <div className="form-group">
            <label className="form-label">🪣 S3 Region <span style={{color: '#ff4458'}}>(Optional)</span></label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="us-east-1" 
              value={s3Region}
              onChange={(e) => setS3Region(e.target.value)}
            />
            <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'}}>AWS region for your bucket</small>
          </div>

          <button className="btn-primary" onClick={saveOptionalCredentials}>Save Optional Credentials</button>
        </div>

        {/* Mode Configuration */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🎯</div>
            <h2 className="card-title">Operation Modes</h2>
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <div>
                <label className="form-label">🤖 Autopilot Mode</label>
                <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', display: 'block'}}>Activates full automation Phase 9</small>
              </div>
              <div 
                className={`toggle-switch ${autopilotMode ? 'active' : ''}`}
                onClick={() => toggleMode('autopilot')}
              >
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <div>
                <label className="form-label">✋ Manual Mode</label>
                <small style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', display: 'block'}}>Activates manual post-only workflows</small>
              </div>
              <div 
                className={`toggle-switch ${manualMode ? 'active' : ''}`}
                onClick={() => toggleMode('manual')}
              >
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 68, 88, 0.1)', border: '1px solid rgba(255, 68, 88, 0.2)', borderRadius: '10px'}}>
            <small style={{color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem'}}>
              ⚠️ <strong>Note:</strong> Only one mode can be active at a time. Autopilot enables full automation, while Manual mode requires user input for each post.
            </small>
          </div>

          <button className="btn-primary" onClick={saveModes}>Save Mode Configuration</button>
        </div>

        {/* Scheduler Settings */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🕒</div>
            <h2 className="card-title">Scheduler Settings</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Post Time</label>
            <input 
              type="time" 
              className="form-input" 
              value={postTime}
              onChange={(e) => setPostTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <label className="form-label">Peak Hour Targeting</label>
              <div 
                className={`toggle-switch ${peakHours ? 'active' : ''}`}
                onClick={() => setPeakHours(!peakHours)}
              >
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Max Scheduled Posts per Day</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="5" 
              min="1" 
              max="50"
              value={maxPosts}
              onChange={(e) => setMaxPosts(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reposting Delay (Days)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="1" 
              min="1" 
              max="30"
              value={repostDelay}
              onChange={(e) => setRepostDelay(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={saveScheduler}>Save Scheduler Settings</button>
        </div>

        {/* App Visuals & Features */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🎨</div>
            <h2 className="card-title">App Visuals & Features</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Default Thumbnail Mode</label>
            <div className="select-wrapper">
              <select 
                className="form-select" 
                value={thumbnailMode}
                onChange={(e) => setThumbnailMode(e.target.value)}
              >
                <option value="first">First Frame</option>
                <option value="best">Best Frame (AI Selected)</option>
                <option value="manual">Upload Manually</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Caption Editor Style</label>
            <div className="select-wrapper">
              <select 
                className="form-select" 
                value={editorStyle}
                onChange={(e) => setEditorStyle(e.target.value)}
              >
                <option value="simple">Simple</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-group">
              <label className="form-label">Enable Cartoon Feature</label>
              <div 
                className={`toggle-switch ${cartoonEnabled ? 'active' : ''}`}
                onClick={() => setCartoonEnabled(!cartoonEnabled)}
              >
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Platform Defaults</label>
            <div className="platform-checkboxes">
              <div className="checkbox-item">
                <div 
                  className={`custom-checkbox ${postToInstagram ? 'checked' : ''}`}
                  onClick={() => setPostToInstagram(!postToInstagram)}
                ></div>
                <span>Post to Instagram</span>
              </div>
              <div className="checkbox-item">
                <div 
                  className={`custom-checkbox ${postToYoutube ? 'checked' : ''}`}
                  onClick={() => setPostToYoutube(!postToYoutube)}
                ></div>
                <span>Post to YouTube</span>
              </div>
              <div className="checkbox-item">
                <div 
                  className={`custom-checkbox ${crossPost ? 'checked' : ''}`}
                  onClick={() => setCrossPost(!crossPost)}
                ></div>
                <span>Cross-post videos</span>
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={saveVisuals}>Save Visual Settings</button>
        </div>

        {/* Storage Settings */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">📥</div>
            <h2 className="card-title">Storage Settings</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Dropbox Folder Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="/Bulk Upload" 
              value={dropboxFolder}
              onChange={(e) => setDropboxFolder(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temporary File Retention (days)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="7" 
              min="1" 
              max="30"
              value={fileRetention}
              onChange={(e) => setFileRetention(e.target.value)}
            />
          </div>

          <button className="btn-primary" onClick={saveStorage}>Save Storage Settings</button>
          <button className="btn-secondary" onClick={cleanupFiles}>🗑️ Cleanup Placeholder Posts</button>
        </div>

        {/* System Status & Testing */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🧪</div>
            <h2 className="card-title">System Status & Testing</h2>
          </div>

          <div className="form-group">
            <label className="form-label">API Connection Status</label>
            <div className="status-indicator">
              <div className="status-dot"></div>
              All systems operational
            </div>
          </div>

          <button className="btn-primary" onClick={validateAPIs}>🔍 Validate All API Keys</button>
          <button className="btn-secondary" onClick={testMongoDB}>☁️ Test MongoDB Connection</button>
          <button className="btn-secondary" onClick={testUpload}>📤 Run Test Upload</button>
        </div>

        {/* Terms of Service */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">📜</div>
            <h2 className="card-title">Terms of Service</h2>
          </div>

          <div className="form-group">
            <div style={{
              background: "rgba(255,255,255,0.05)", 
              padding: "1.5rem", 
              borderRadius: "10px", 
              border: "1px solid rgba(255,255,255,0.1)",
              lineHeight: "1.6",
              color: "rgba(255,255,255,0.9)"
            }}>
              <h3 style={{color: "#fff", marginBottom: "1rem"}}>Terms of Service</h3>
              <p style={{marginBottom: "1rem"}}>
                By using this app, you agree to allow us to schedule and publish content to your connected social media accounts.
                You retain full ownership of your content. We are not responsible for platform restrictions or takedowns.
              </p>
              <p style={{fontSize: "0.9rem", color: "rgba(255,255,255,0.7)"}}>
                <strong>Key Points:</strong>
              </p>
              <ul style={{fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", paddingLeft: "1.5rem"}}>
                <li>You maintain full ownership of all content</li>
                <li>We only access accounts you explicitly connect</li>
                <li>Service is provided "as-is" without guarantees</li>
                <li>You are responsible for compliance with platform policies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-emoji">🔒</div>
            <h2 className="card-title">Privacy Policy</h2>
          </div>

          <div className="form-group">
            <div style={{
              background: "rgba(255,255,255,0.05)", 
              padding: "1.5rem", 
              borderRadius: "10px", 
              border: "1px solid rgba(255,255,255,0.1)",
              lineHeight: "1.6",
              color: "rgba(255,255,255,0.9)"
            }}>
              <h3 style={{color: "#fff", marginBottom: "1rem"}}>Privacy Policy</h3>
              <p style={{marginBottom: "1rem"}}>
                We only access the data required to connect your social media accounts and publish content on your behalf.
                We do not sell or share your data. You may disconnect your account at any time.
              </p>
              <p style={{fontSize: "0.9rem", color: "rgba(255,255,255,0.7)"}}>
                <strong>Data We Access:</strong>
              </p>
              <ul style={{fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", paddingLeft: "1.5rem"}}>
                <li>Social media account information for posting</li>
                <li>Video files you choose to upload or process</li>
                <li>Settings and preferences you configure</li>
                <li>API tokens (stored securely, never shared)</li>
              </ul>
              <p style={{fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginTop: "1rem"}}>
                <strong>Your Rights:</strong> You can disconnect accounts, delete data, or stop using the service at any time.
              </p>
            </div>
          </div>
        </div>

    </div>
  );
}