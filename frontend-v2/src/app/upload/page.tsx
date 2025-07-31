'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Video {
  id: number;
  title: string;
  duration: string;
  thumbnail: string;
  aiCaption: string;
  hashtags: string[];
  audioRec: string;
  status: 'ready' | 'review' | 'posted' | 'processing';
}

export default function UploadPage() {
  const [uploadedVideos, setUploadedVideos] = useState<Video[]>([]);
  const [urlUploadActive, setUrlUploadActive] = useState(false);
  const particlesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Sample video data for demo
  const sampleVideos: Video[] = [
    {
      id: 1,
      title: "Morning Workout Routine",
      duration: "2:34",
      thumbnail: "🏃‍♀️",
      aiCaption: "Start your day right with this energizing morning workout routine! Perfect for beginners.",
      hashtags: ["#morningworkout", "#fitness", "#healthy", "#motivation", "#exercise"],
      audioRec: "Upbeat Electronic - Energetic Vibes",
      status: "ready"
    },
    {
      id: 2,
      title: "Healthy Breakfast Ideas",
      duration: "1:45",
      thumbnail: "🥗",
      aiCaption: "Quick and nutritious breakfast ideas that will fuel your day with energy and flavor.",
      hashtags: ["#healthybreakfast", "#nutrition", "#foodie", "#wellness", "#quickmeals"],
      audioRec: "Calm Acoustic - Morning Coffee",
      status: "review"
    }
  ];

  useEffect(() => {
    createParticles();
    setupDragDrop();
    
    // Load sample data for demo
    if (window.location.search.includes('demo=true')) {
      setUploadedVideos([...sampleVideos]);
      showNotification('📋 Demo data loaded!');
    }
    
    showNotification('📤 Upload page ready!');
  }, []);

  const createParticles = () => {
    if (!particlesRef.current) return;
    
    particlesRef.current.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesRef.current.appendChild(particle);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      animation: slideInRight 0.3s ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    if (!document.getElementById('notificationStyle')) {
      const style = document.createElement('style');
      style.id = 'notificationStyle';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%) scale(0.8); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const toggleUrlUpload = () => {
    setUrlUploadActive(!urlUploadActive);
    if (!urlUploadActive) {
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 300);
    }
  };

  const handleSourceClick = (source: string) => {
    const sourceName = {
      'dropbox': 'Dropbox',
      'gdrive': 'Google Drive', 
      'youtube': 'YouTube'
    }[source] || source;
    
    showNotification(`🔗 Connecting to ${sourceName}...`);
    
    setTimeout(() => {
      showNotification(`✅ ${sourceName} connected successfully!`);
    }, 1500);
  };

  const setupDragDrop = () => {
    const uploadBox = document.getElementById('fileUploadBox');
    if (!uploadBox) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadBox.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e: Event) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadBox.addEventListener(eventName, () => {
        uploadBox.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadBox.addEventListener(eventName, () => {
        uploadBox.classList.remove('dragover');
      }, false);
    });

    uploadBox.addEventListener('drop', handleDrop, false);
  };

  const handleDrop = (e: any) => {
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = (files: FileList) => {
    const videoFiles = Array.from(files).filter(file => 
      file.type.startsWith('video/')
    );
    
    if (videoFiles.length === 0) {
      showNotification('❌ Please select video files only', 'error');
      return;
    }

    showNotification(`📹 Uploading ${videoFiles.length} video${videoFiles.length > 1 ? 's' : ''}...`);
    
    setTimeout(() => {
      const newVideos = videoFiles.map((file, index) => ({
        id: Date.now() + index,
        title: file.name.replace(/\.[^/.]+$/, ""),
        duration: "0:00",
        thumbnail: "📹",
        aiCaption: "Processing...",
        hashtags: ["#processing"],
        audioRec: "Analyzing audio...",
        status: "processing" as const
      }));
      
      setUploadedVideos(prev => [...prev, ...newVideos]);
      showNotification(`✅ ${videoFiles.length} video${videoFiles.length > 1 ? 's' : ''} uploaded successfully!`);
      
      setTimeout(() => {
        processVideosWithAI(newVideos.map(v => v.id));
      }, 2000);
    }, 1000);
  };

  const processVideosWithAI = (videoIds: number[]) => {
    setUploadedVideos(prev => prev.map(video => {
      if (videoIds.includes(video.id) && video.status === 'processing') {
        return {
          ...video,
          aiCaption: "Amazing content! This video showcases great techniques and will perform well on social media.",
          hashtags: ["#lifestyle", "#content", "#viral", "#trending", "#social"],
          audioRec: "Trending Hip-Hop - Social Media Vibe",
          status: "ready" as const,
          duration: Math.floor(Math.random() * 5) + 1 + ":" + String(Math.floor(Math.random() * 60)).padStart(2, '0')
        };
      }
      return video;
    }));
    
    showNotification('🧠 AI processing completed!');
  };

  const refreshCaption = (videoId: number) => {
    showNotification('🧠 Regenerating AI caption...');
    
    setTimeout(() => {
      const captions = [
        "Fresh take on this amazing content! Your audience will love this engaging piece.",
        "Incredible content that's perfect for boosting engagement and reaching new audiences.",
        "This video has all the elements for viral success! Great work on the content creation.",
        "Outstanding quality content that will perform exceptionally well across all platforms."
      ];
      
      setUploadedVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, aiCaption: captions[Math.floor(Math.random() * captions.length)] }
          : video
      ));
      
      showNotification('✅ Caption refreshed successfully!');
    }, 1500);
  };

  const refreshAudio = (videoId: number) => {
    showNotification('🎵 Finding new audio recommendation...');
    
    setTimeout(() => {
      const audioOptions = [
        "Chill Lo-Fi - Study Vibes",
        "Upbeat Pop - Dance Energy",
        "Motivational Rock - Workout Power",
        "Smooth Jazz - Relaxing Mood",
        "Electronic Dance - Party Atmosphere",
        "Acoustic Folk - Natural Feel"
      ];
      
      setUploadedVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, audioRec: audioOptions[Math.floor(Math.random() * audioOptions.length)] }
          : video
      ));
      
      showNotification('✅ Audio recommendation updated!');
    }, 1500);
  };

  const processAllVideos = () => {
    const readyVideos = uploadedVideos.filter(v => v.status === 'ready').length;
    
    if (readyVideos === 0) {
      showNotification('⚠️ No videos ready for processing', 'error');
      return;
    }
    
    showNotification(`🚀 Processing ${readyVideos} videos...`);
    
    setTimeout(() => {
      setUploadedVideos(prev => prev.map(video => 
        video.status === 'ready' 
          ? { ...video, status: 'posted' as const }
          : video
      ));
      
      showNotification(`🚀 ${readyVideos} videos processed successfully! Phase 1 complete.`);
    }, 2000);
  };

  const refreshQueue = () => {
    showNotification('🔄 Refreshing upload queue...');
    
    setTimeout(() => {
      showNotification('✅ Queue refreshed successfully!');
      
      if (Math.random() > 0.5) {
        const newVideo: Video = {
          id: Date.now(),
          title: "New Content from Cloud",
          duration: "1:20",
          thumbnail: "☁️",
          aiCaption: "Fresh content detected from your cloud storage!",
          hashtags: ["#cloudcontent", "#fresh", "#new"],
          audioRec: "Auto-detected - Trending Sound",
          status: "ready"
        };
        setUploadedVideos(prev => [...prev, newVideo]);
      }
    }, 1500);
  };

  const clearAll = () => {
    if (uploadedVideos.length === 0) {
      showNotification('⚠️ No videos to clear', 'error');
      return;
    }
    
    if (confirm('Are you sure you want to clear all uploaded videos? This action cannot be undone.')) {
      setUploadedVideos([]);
      showNotification('🗑️ All videos cleared successfully!');
    }
  };

  const handleUrlSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && urlInputRef.current?.value.trim()) {
      const url = urlInputRef.current.value.trim();
      showNotification('🌐 Processing URL upload...');
      
      setTimeout(() => {
        const urlVideo: Video = {
          id: Date.now(),
          title: "Video from URL",
          duration: "2:15",
          thumbnail: "🔗",
          aiCaption: "Content imported from URL - AI analysis in progress...",
          hashtags: ["#imported", "#url", "#processing"],
          audioRec: "Detecting audio...",
          status: "processing"
        };
        
        setUploadedVideos(prev => [...prev, urlVideo]);
        urlInputRef.current!.value = '';
        showNotification('✅ URL video imported successfully!');
        
        setTimeout(() => {
          processVideosWithAI([urlVideo.id]);
        }, 2000);
      }, 1500);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'ready': { class: 'status-ready', text: '✅ Ready for Autopilot' },
      'review': { class: 'status-review', text: '⚠️ Needs Review' },
      'posted': { class: 'status-posted', text: '✓ Already Posted' },
      'processing': { class: 'status-processing', text: '⏳ Processing...' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.ready;
  };

  return (
    <div>
      <div className="floating-particles" ref={particlesRef}></div>
      
      <div className="upload-container">
        <header className="header">
          <Link href="/dashboard" className="back-btn">
            ← Back to Dashboard
          </Link>
          <h1 className="page-title">📤 Upload & Process Videos</h1>
          <div></div>
        </header>

        {/* Upload Options Section */}
        <div className="upload-section">
          <h2 className="section-title">📁 Upload Options</h2>
          
          <div className="upload-options">
            {/* File Upload */}
            <div className="upload-box" id="fileUploadBox" onClick={triggerFileUpload}>
              <input 
                type="file" 
                ref={fileInputRef}
                multiple 
                accept="video/*" 
                style={{display: 'none'}}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <span className="upload-icon">📎</span>
              <div className="upload-title">File Upload</div>
              <div className="upload-subtitle">Drag & drop videos or click to browse<br/>Supports MP4, MOV, AVI, WebM</div>
            </div>

            {/* URL Upload */}
            <div className="upload-box url-upload" onClick={toggleUrlUpload}>
              <span className="upload-icon">🌐</span>
              <div className="upload-title">URL Upload</div>
              <div className="upload-subtitle">Import from cloud storage<br/>Dropbox, Google Drive, YouTube</div>
              
              <div className={`url-input-container ${urlUploadActive ? 'active' : ''}`}>
                <input 
                  type="text" 
                  className="url-input" 
                  ref={urlInputRef}
                  placeholder="Paste video URL here..."
                  onKeyPress={handleUrlSubmit}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="url-sources">
                  <button className="source-btn" onClick={(e) => {e.stopPropagation(); handleSourceClick('dropbox')}}>📦 Dropbox</button>
                  <button className="source-btn" onClick={(e) => {e.stopPropagation(); handleSourceClick('gdrive')}}>💽 Google Drive</button>
                  <button className="source-btn" onClick={(e) => {e.stopPropagation(); handleSourceClick('youtube')}}>▶️ YouTube</button>
                </div>
              </div>
            </div>
          </div>

          <div className="upload-notes">
            <strong>🧠 Upload Notes:</strong><br/>
            Videos will automatically be scanned by AI for captions, audio, hashtags, and platform targeting.
          </div>
        </div>

        {/* Video Queue Section */}
        <div className="queue-section">
          <h2 className="section-title">📄 Video Queue Preview</h2>
          
          {uploadedVideos.length === 0 ? (
            <div className="empty-queue">
              <div className="empty-icon">🎬</div>
              <h3>No videos uploaded yet</h3>
              <p>Upload some videos to see them processed here</p>
            </div>
          ) : (
            <div className="video-queue">
              {uploadedVideos.map(video => {
                const statusInfo = getStatusInfo(video.status);
                return (
                  <div key={video.id} className="video-item">
                    <div className="video-thumbnail">
                      {video.thumbnail}
                      <div style={{position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem'}}>
                        {video.duration}
                      </div>
                    </div>
                    
                    <div className="video-info">
                      <div className="video-title">
                        🎬 {video.title}
                      </div>
                      <div className="video-duration">⏱️ Duration: {video.duration}</div>
                      
                      <div className="ai-preview">
                        <div className="ai-section">
                          <div className="ai-label">📝 AI Caption</div>
                          <div className="ai-content">{video.aiCaption}</div>
                        </div>
                        
                        <div className="ai-section">
                          <div className="ai-label">🧠 Tags/Hashtags</div>
                          <div className="hashtags">
                            {video.hashtags.slice(0, 5).map((tag, index) => (
                              <span key={index} className="hashtag">{tag}</span>
                            ))}
                            {video.hashtags.length > 5 && (
                              <span className="hashtag more">+{video.hashtags.length - 5} more</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ai-section">
                          <div className="audio-recommendation">
                            🎧 {video.audioRec}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="video-actions">
                      <div className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.text}
                      </div>
                      
                      <div className="action-buttons">
                        <button className="refresh-btn" onClick={() => refreshCaption(video.id)} title="Refresh Caption">
                          📝
                        </button>
                        <button className="refresh-btn" onClick={() => refreshAudio(video.id)} title="Refresh Audio">
                          🎧
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Action Buttons */}
        <div className="main-actions">
          <button className="main-btn btn-primary" onClick={processAllVideos}>
            🚀 Process All Videos Now
          </button>
          <button className="main-btn btn-secondary" onClick={refreshQueue}>
            🔄 Refresh Upload Queue
          </button>
          <button className="main-btn btn-danger" onClick={clearAll}>
            🗑️ Clear All
          </button>
        </div>
      </div>
    </div>
  );
}