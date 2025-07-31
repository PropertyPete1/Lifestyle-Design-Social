'use client';

import { useState, useEffect } from 'react';

export default function ManualPost() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [captionText, setCaptionText] = useState('');
  const [audioName, setAudioName] = useState('Trending Beat #247');
  const [scheduleTime, setScheduleTime] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  const videoData = [
    {
      id: 1,
      title: "Morning Routine Transformation",
      duration: "2:34",
      caption: "Transform your mornings with these 5 simple habits that changed my life! 🌅✨ From meditation to meal prep, discover the secrets to starting your day right.",
      thumbnail: "🌅",
      audio: "Motivational Morning Beat",
      platforms: ["instagram", "youtube"]
    },
    {
      id: 2,
      title: "Minimalist Home Tour",
      duration: "4:12",
      caption: "Welcome to my minimalist sanctuary! 🏠✨ Less stuff, more peace. Here's how I created a calm, clutter-free space that sparks joy every single day.",
      thumbnail: "🏠",
      audio: "Chill Vibes Acoustic",
      platforms: ["instagram"]
    },
    {
      id: 3,
      title: "Healthy Meal Prep Ideas",
      duration: "3:45",
      caption: "Meal prep like a pro! 🥗💚 These 7 healthy recipes will save you time and keep you energized all week. No more takeout guilt!",
      thumbnail: "🥗",
      audio: "Upbeat Kitchen Jam",
      platforms: ["youtube", "instagram"]
    },
    {
      id: 4,
      title: "Productivity Hacks That Work",
      duration: "5:21",
      caption: "Stop procrastinating and start achieving! 🚀⚡ These productivity hacks helped me 10x my output while working fewer hours.",
      thumbnail: "⚡",
      audio: "Focus Flow Beat",
      platforms: ["youtube"]
    },
    {
      id: 5,
      title: "Self-Care Sunday Routine",
      duration: "6:18",
      caption: "Sunday self-care is non-negotiable! 🛁🕯️ Join me for a full day of relaxation, skincare, and mental reset. You deserve this peace.",
      thumbnail: "🛁",
      audio: "Relaxing Spa Sounds",
      platforms: ["instagram", "youtube"]
    },
    {
      id: 6,
      title: "Budget-Friendly Room Makeover",
      duration: "7:33",
      caption: "Room transformation on a budget! 💰✨ Watch me completely redesign this space for under $200. Prove that style doesn't have to be expensive!",
      thumbnail: "🎨",
      audio: "DIY Upbeat Track",
      platforms: ["youtube"]
    }
  ];

  const defaultHashtags = [
    "#lifestyle", "#motivation", "#inspiration", "#selfcare", "#wellness", "#mindfulness",
    "#productivity", "#success", "#goals", "#mindset", "#growth", "#happiness",
    "#health", "#fitness", "#morning", "#routine", "#habits", "#transformation",
    "#minimalism", "#organization", "#declutter", "#simplicity", "#peace", "#calm",
    "#meditation", "#gratitude", "#positivity", "#energy", "#balance", "#focus"
  ];

  const trendingAudios = [
    "Trending Beat #247",
    "Viral Melody Mix",
    "Popular Piano Loop",
    "Energetic Pop Track",
    "Chill Vibes Original",
    "Motivational Anthem",
    "Smooth Jazz Blend",
    "Uplifting Acoustic"
  ];

  useEffect(() => {
    // Initialize hashtags
    setHashtags(defaultHashtags);
    
    // Set default schedule time
    const now = new Date();
    now.setHours(13, 45, 0, 0);
    setScheduleTime(now.toISOString().slice(0, 16));

    // Create floating particles
    createParticles();
  }, []);

  const createParticles = () => {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesContainer.appendChild(particle);
    }
  };

  const selectVideo = (video: any) => {
    setSelectedVideo(video);
    setCaptionText(video.caption);
    setAudioName(video.audio);
    showNotification(`📹 Selected: ${video.title}`);
  };

  const selectPlatform = (platform: string) => {
    setSelectedPlatform(platform);
    const platformNames = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      both: 'Both Platforms'
    };
    showNotification(`📌 Platform: ${platformNames[platform as keyof typeof platformNames]}`);
  };

  const refreshAudio = () => {
    const randomAudio = trendingAudios[Math.floor(Math.random() * trendingAudios.length)];
    setAudioName(randomAudio);
    showNotification(`🎵 Audio updated: ${randomAudio}`);
  };

  const removeHashtag = (index: number) => {
    const newHashtags = hashtags.filter((_, i) => i !== index);
    setHashtags(newHashtags);
    showNotification(`🏷️ Hashtag removed`);
  };

  const postNow = () => {
    if (!selectedVideo) {
      showNotification('⚠️ Please select a video first!', 'error');
      return;
    }
    showNotification(`🚀 Posting "${selectedVideo.title}" to ${selectedPlatform}!`, 'success');
  };

  const schedulePost = () => {
    if (!selectedVideo) {
      showNotification('⚠️ Please select a video first!', 'error');
      return;
    }
    showNotification(`📅 Scheduled "${selectedVideo.title}" for ${scheduleTime}!`, 'success');
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

  const showNotification = (message: string, type: string = 'success') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  return (
    <div>
      <div className="floating-particles" id="particles"></div>
      
      <div className="container">
        <header className="header">
          <button className="back-btn" onClick={goBack}>
            🔙 Back to Dashboard
          </button>
          <h1 className="page-title">Manual Post Creator</h1>
        </header>

        <section className="video-queue-section">
          <h2 className="section-title">
            🎬 Select a Video to Post
          </h2>
          
          <div className="video-grid">
            {videoData.map((video) => (
              <div 
                key={video.id}
                className={`video-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                onClick={() => selectVideo(video)}
              >
                <div className="video-thumbnail">
                  {video.thumbnail}
                  <div className="play-overlay">▶️</div>
                  <div className="video-duration">{video.duration}</div>
                </div>
                <div className="video-info">
                  <div className="video-title">{video.title}</div>
                  <div className="video-caption">{video.caption}</div>
                </div>
                <div className="video-meta">
                  <div className="trending-audio">
                    🎧 {video.audio}
                    <button className="refresh-btn" onClick={(e) => {
                      e.stopPropagation();
                      const randomAudio = trendingAudios[Math.floor(Math.random() * trendingAudios.length)];
                      video.audio = randomAudio;
                      showNotification(`🎵 Audio updated for video`);
                    }}>🔁</button>
                  </div>
                  <div className="platform-selector">
                    {video.platforms.map(platform => (
                      <span key={platform} className={`platform-tag ${platform}`}>
                        {platform === 'instagram' ? '📷 IG' : '▶️ YT'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedVideo && (
          <section className="editor-panel show">
            <h2 className="section-title">
              🛠️ Manual Editor Panel
            </h2>
            
            <div className="editor-grid">
              <div className="video-preview">
                <h3 className="form-label">📽️ Video Preview</h3>
                <div className="preview-video">
                  {selectedVideo.thumbnail}
                  <div className="play-overlay">▶️</div>
                </div>
                <div className="video-title">{selectedVideo.title}</div>
              </div>

              <div className="editor-form">
                <div className="form-group">
                  <label className="form-label">✍️ Caption</label>
                  <textarea 
                    className="form-textarea" 
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Write your caption here..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🏷️ Hashtags (30 auto-filled)</label>
                  <div className="hashtags-container">
                    {hashtags.map((hashtag, index) => (
                      <div key={index} className="hashtag">
                        {hashtag}
                        <span className="hashtag-remove" onClick={() => removeHashtag(index)}>×</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">🎶 Trending Audio</label>
                  <div className="audio-selector">
                    <div className="audio-info">
                      <div className="audio-wave">🎵</div>
                      <span>{audioName}</span>
                    </div>
                    <button className="refresh-btn" onClick={refreshAudio}>🔁</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">📌 Platform Selector</label>
                  <div className="platform-selector">
                    <button 
                      className={`platform-tag instagram ${selectedPlatform === 'instagram' ? 'active' : ''}`}
                      onClick={() => selectPlatform('instagram')}
                    >
                      📷 IG
                    </button>
                    <button 
                      className={`platform-tag youtube ${selectedPlatform === 'youtube' ? 'active' : ''}`}
                      onClick={() => selectPlatform('youtube')}
                    >
                      ▶️ YT
                    </button>
                    <button 
                      className={`platform-tag both ${selectedPlatform === 'both' ? 'active' : ''}`}
                      onClick={() => selectPlatform('both')}
                    >
                      🌐 Both
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">⏰ Schedule Time</label>
                  <div className="time-picker-container">
                    <input 
                      type="datetime-local" 
                      className="time-picker"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                    <div className="peak-hour-suggestion">
                      🧠 Recommended post time: 1:45 PM
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="action-btn post-now-btn" onClick={postNow}>
                    🚀 Post Now
                  </button>
                  <button className="action-btn schedule-btn" onClick={schedulePost}>
                    📅 Schedule for Later
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}