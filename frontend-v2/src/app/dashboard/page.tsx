'use client';

import React, { useState, useEffect, useRef } from 'react';

type DashboardSettings = {
  autopilot: boolean
  maxPosts: number
  postTime: string
  repostDelay: number
  manual: boolean
}

const defaultStatus: DashboardSettings = {
  autopilot: false,
  maxPosts: 3,
  postTime: '14:00',
  repostDelay: 1,
  manual: true
}

export default function Dashboard() {
  const [currentPlatform, setCurrentPlatform] = useState('instagram');
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<DashboardSettings>(defaultStatus);
  const [stats, setStats] = useState({
    instagram: {
      followers: '24.8K',
      engagement: '4.7%',
      reach: '89.2K',
      autoPostsPerDay: `${status.maxPosts}/day`
    },
    youtube: {
      subscribers: '12.4K',
      watchTime: '2.1K',
      views: '156K',
      autoUploadsPerWeek: '2/week'
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [lastQueueUpdate, setLastQueueUpdate] = useState<number>(0);

  // Helper function to format activity data
  const formatActivity = (activity: any) => {
    const timeAgo = getTimeAgo(activity.createdAt);
    console.log(`🕒 Activity ${activity.type}: ${activity.createdAt} -> ${timeAgo}`);
    
    let title = '';
    let icon = '📊';
    
    switch (activity.type) {
      case 'scrape':
        title = `Scraped ${activity.postsProcessed} Instagram posts`;
        icon = '🔍';
        break;
      case 'schedule':
        title = `Queued ${activity.postsSuccessful} videos for posting`;
        icon = '📅';
        break;
      case 'repost':
        if (activity.postsSuccessful > 0) {
          title = `Posted ${activity.postsSuccessful} videos successfully`;
          icon = '✅';
        } else {
          title = 'Checked for posts to publish';
          icon = '🔄';
        }
        break;
      default:
        title = `${activity.type} completed`;
        icon = '📊';
    }
    
    return { title, icon, timeAgo };
  };

  // Helper function to get time ago
  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const activityDate = new Date(date);
    
    // Validate the date
    if (isNaN(activityDate.getTime())) {
      return 'Unknown time';
    }
    
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Handle negative time differences (future dates)
    if (diffMs < 0) return 'Just now';
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show actual date
    return activityDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const instagramCanvasRef = useRef<HTMLCanvasElement>(null);
  const youtubeCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Load settings and analytics from backend on component mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('http://localhost:3002/api/settings')
        if (res.ok) {
          const data = await res.json()
          setStatus({
            autopilot: data.autopilot || false,
            manual: data.manual !== false,
            maxPosts: data.maxPosts || 3,
            postTime: data.postTime || '14:00',
            repostDelay: data.repostDelay || 1
          })
        } else {
          console.warn('⚠️ No settings found, using defaults.')
        }

        // Also fetch Phase 9 status for additional autopilot data
        try {
          const phase9Res = await fetch('http://localhost:3002/api/phase9/status')
          if (phase9Res.ok) {
            const phase9Data = await phase9Res.json()
            if (phase9Data.success) {
              console.log('📊 Phase 9 Status:', phase9Data.data)
              // Update status with real autopilot data
              setStatus(prev => ({
                ...prev,
                autopilot: phase9Data.data.isEnabled || false
              }))
              // Update recent activity
              const activities = phase9Data.data.recentActivity || []
              console.log('📊 Recent Activity Data:', activities.slice(0, 2)) // Debug first 2 activities
              setRecentActivity(activities)
              // Update autopilot status for chart effects
              setAutopilotRunning(phase9Data.data.isRunning || false)
              const newQueueSize = phase9Data.data.queue?.queued || 0
              if (newQueueSize !== queueSize) {
                setLastQueueUpdate(Date.now())
              }
              setQueueSize(newQueueSize)
            }
          }
        } catch (phase9Err) {
          console.warn('⚠️ Phase 9 status not available:', phase9Err)
        }
      } catch (err) {
        console.error('❌ Failed to load settings for dashboard:', err)
      }
    }

    async function fetchAnalytics() {
      try {
        setAnalyticsLoading(true);
        
        // Fetch both Instagram and YouTube analytics in parallel
        const [instagramRes, youtubeRes] = await Promise.all([
                  fetch('http://localhost:3002/api/instagram/analytics'),
        fetch('http://localhost:3002/api/youtube/analytics')
        ]);

        let instagramData: any = {};
        let youtubeData: any = {};

        if (instagramRes.ok) {
          const igResult = await instagramRes.json();
          if (igResult.success && igResult.analytics) {
            instagramData = igResult.analytics;
            console.log('✅ Instagram analytics loaded:', instagramData.formatted);
          }
        } else {
          console.warn('⚠️ Failed to load Instagram analytics');
        }

        if (youtubeRes.ok) {
          const ytResult = await youtubeRes.json();
          if (ytResult.success && ytResult.analytics) {
            youtubeData = ytResult.analytics;
            console.log('✅ YouTube analytics loaded:', youtubeData.formatted);
          }
        } else {
          console.warn('⚠️ Failed to load YouTube analytics');
        }

        // Update stats with real data
        setStats(prevStats => ({
          instagram: {
            followers: instagramData.formatted?.followers || prevStats.instagram.followers,
            engagement: instagramData.formatted?.engagement || prevStats.instagram.engagement,
            reach: instagramData.formatted?.reach || prevStats.instagram.reach,
            autoPostsPerDay: `${status.maxPosts}/day`
          },
          youtube: {
            subscribers: youtubeData.formatted?.subscribers || prevStats.youtube.subscribers,
            watchTime: youtubeData.formatted?.watchTime || prevStats.youtube.watchTime,
            views: youtubeData.formatted?.views || prevStats.youtube.views,
            autoUploadsPerWeek: '2/week'
          }
        }));

      } catch (err) {
        console.error('❌ Failed to load analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchStatus();
    fetchAnalytics();
    
    // Set up periodic refresh for real-time chart effects
    const statusInterval = setInterval(fetchStatus, 10000); // Every 10 seconds
    
    return () => clearInterval(statusInterval);
  }, [])

  useEffect(() => {
    // Update stats when status changes
    setStats(prevStats => ({
      ...prevStats,
      instagram: {
        ...prevStats.instagram,
        autoPostsPerDay: `${status.maxPosts}/day`
      }
    }));
  }, [status]);

  useEffect(() => {
    // Create particles
    const createParticles = () => {
      if (!particlesRef.current) return;
      
      // Clear existing particles
      particlesRef.current.innerHTML = '';
      
      // Create 20 particles
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = `particle ${currentPlatform}`;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particlesRef.current.appendChild(particle);
      }
    };

    createParticles();
  }, [currentPlatform]);

  useEffect(() => {
    // Draw charts
    const drawChart = (canvas: HTMLCanvasElement | null, platform: string) => {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      let animationFrame = 0;
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
          const y = (canvas.height / 10) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        // Calculate pulse effects based on real data
        const queueIntensity = Math.min(queueSize / 10, 1); // Max intensity at 10+ videos
        const runningGlow = autopilotRunning ? 0.3 : 0;
        const burstEffect = Date.now() - lastQueueUpdate < 5000 ? Math.sin(animationFrame * 0.5) * 0.5 : 0;
        
        // Enhanced wave intensity based on queue size
        const baseAmplitude = 50;
        const queueAmplitude = baseAmplitude * (0.5 + queueIntensity * 0.5);
        const secondaryAmplitude = 30 * (0.5 + queueIntensity * 0.5);
        
        // Draw animated line with dynamic intensity
        const points = [];
        for (let i = 0; i <= 100; i++) {
          const x = (canvas.width / 100) * i;
          const y = canvas.height / 2 + 
                   Math.sin((i + animationFrame) * 0.1) * queueAmplitude + 
                   Math.sin((i + animationFrame) * 0.05) * secondaryAmplitude;
          points.push({x, y});
        }
        
        // Add glow effect when autopilot is running
        if (autopilotRunning || burstEffect > 0) {
          const glowIntensity = runningGlow + Math.abs(burstEffect);
          ctx.shadowColor = platform === 'youtube' ? '#ff0000' : '#e1306c';
          ctx.shadowBlur = 20 * glowIntensity;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // Platform-specific gradient with dynamic opacity
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        const opacity = 0.8 + (queueIntensity * 0.2) + runningGlow;
        
        if (platform === 'youtube') {
          gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(255, 68, 68, ${opacity})`);
          gradient.addColorStop(1, `rgba(204, 0, 0, ${opacity})`);
        } else {
          gradient.addColorStop(0, `rgba(255, 68, 88, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(225, 48, 108, ${opacity})`);
          gradient.addColorStop(1, `rgba(131, 58, 180, ${opacity})`);
        }
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3 + (queueIntensity * 2); // Thicker lines for more activity
        ctx.beginPath();
        
        points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        
        ctx.stroke();
        
        // Add particle burst effect for new content
        if (burstEffect > 0) {
          const particleCount = Math.floor(queueSize / 2) + 3;
          for (let p = 0; p < particleCount; p++) {
            const px = Math.random() * canvas.width;
            const py = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(burstEffect) * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Reset shadow for next frame
        ctx.shadowBlur = 0;
        
        animationFrame += 0.5;
        requestAnimationFrame(animate);
      };
      
      animate();
    };

    drawChart(instagramCanvasRef.current, 'instagram');
    drawChart(youtubeCanvasRef.current, 'youtube');
  }, [autopilotRunning, queueSize, lastQueueUpdate]);

  const switchPlatform = (platform: string) => {
    try {
      console.log(`Switching to ${platform}`);
      setCurrentPlatform(platform);
      showNotification(`📱 Switched to ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
    } catch (error) {
      console.error('Error switching platform:', error);
      showNotification('❌ Error switching platform', 'error');
    }
  };

  const toggleMenu = () => {
    try {
      setMenuOpen(!menuOpen);
    } catch (error) {
      console.error('Error toggling menu:', error);
    }
  };

  const handleMenuClick = (action: string) => {
    try {
      console.log('Menu action:', action);
      
      // Close menu first
      setMenuOpen(false);
      
      // Add your menu action handlers here
      switch(action) {
        case 'upload':
          showNotification('📤 Opening Upload Videos page...');
          // Navigate to upload page
          setTimeout(() => {
            window.location.href = '/upload';
          }, 500);
          break;
        case 'autopilot':
          showNotification('🚀 Opening AutoPilot dashboard...');
          // Navigate to autopilot page
          setTimeout(() => {
            window.location.href = '/autopilot';
          }, 500);
          break;
        case 'manual':
          showNotification('✍ Opening Manual Post editor...');
          // Navigate to manual post page
          setTimeout(() => {
            window.location.href = '/manual';
          }, 500);
          break;
        case 'cartoons':
          showNotification('🎬 Cartoon generator loading...');
          break;
        case 'settings':
          showNotification('⚙ Opening Settings panel...');
          // Navigate to settings page
          setTimeout(() => {
            window.location.href = '/settings';
          }, 500);
          break;
        default:
          showNotification('🔧 Feature coming soon!');
      }
    } catch (error) {
      console.error('Error handling menu click:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    try {
      // Create a temporary notification
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
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 500;
        max-width: 300px;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const handleControlBtnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const parent = e.currentTarget.parentElement;
      if (parent) {
        const activeBtn = parent.querySelector('.control-btn.active');
        if (activeBtn) {
          activeBtn.classList.remove('active');
        }
        e.currentTarget.classList.add('active');
      }
      
      showNotification(`📊 Chart period changed to ${e.currentTarget.textContent}`);
    } catch (error) {
      console.error('Error handling control button click:', error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menuContainer = document.querySelector('.menu-container');
      if (!menuContainer?.contains(e.target as Node) && menuOpen) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
      if (e.key === '1' && e.ctrlKey) {
        e.preventDefault();
        switchPlatform('instagram');
      }
      if (e.key === '2' && e.ctrlKey) {
        e.preventDefault();
        switchPlatform('youtube');
      }
      if (e.key === 'u' && e.ctrlKey) {
        e.preventDefault();
        handleMenuClick('upload');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  return (
    <div>
      <div className="floating-particles" ref={particlesRef}></div>
      <div className={`menu-overlay ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)}></div>
      
      <div className="dashboard-container">
        <header className="header">
          <div className="platform-switcher">
            <button 
              className={`platform-btn instagram ${currentPlatform === 'instagram' ? 'active' : ''}`}
              onClick={() => switchPlatform('instagram')}
            >
              📷 Instagram
            </button>
            <button 
              className={`platform-btn youtube ${currentPlatform === 'youtube' ? 'active' : ''}`}
              onClick={() => switchPlatform('youtube')}
            >
              ▶️ YouTube
            </button>
          </div>

          <div className="logo">Lifestyle Design Social</div>
          
          <div className="header-right">
            <div className="menu-container">
              <div className={`menu-btn ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <span className="menu-icon">⋮</span>
              </div>
              <div className={`dropdown-menu ${menuOpen ? 'show' : ''}`}>
                <div className="menu-item" onClick={() => handleMenuClick('upload')}>
                  <div className="menu-item-icon">📤</div>
                  <span>Upload Videos</span>
                </div>
                <div className="menu-item" onClick={() => handleMenuClick('autopilot')}>
                  <div className="menu-item-icon">🚀</div>
                  <span>AutoPilot</span>
                </div>
                <div className="menu-item" onClick={() => handleMenuClick('manual')}>
                  <div className="menu-item-icon">✍</div>
                  <span>Manual Post</span>
                </div>
                <div className="menu-item" onClick={() => handleMenuClick('cartoons')}>
                  <div className="menu-item-icon">🎬</div>
                  <span>Cartoons</span>
                </div>
                <div className="menu-item" onClick={() => handleMenuClick('settings')}>
                  <div className="menu-item-icon">⚙</div>
                  <span>Settings</span>
                </div>
              </div>
            </div>

            <div className="user-profile">
              <div className="avatar">SM</div>
              <div className="status-indicator"></div>
            </div>
          </div>
        </header>

        {/* Instagram Data */}
        <div id="instagram-data" className={`platform-data ${currentPlatform === 'instagram' ? 'active' : ''}`}>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Followers</span>
                <div className="metric-icon">👥</div>
              </div>
              <div className="metric-value">{stats.instagram.followers}</div>
              <div className="metric-change change-positive">
                ↗ +5.2% this week
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Engagement Rate</span>
                <div className="metric-icon">❤️</div>
              </div>
              <div className="metric-value">{stats.instagram.engagement}</div>
              <div className="metric-change change-positive">
                ↗ +0.8% from last post
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Reach</span>
                <div className="metric-icon">📊</div>
              </div>
              <div className="metric-value">{stats.instagram.reach}</div>
              <div className="metric-change change-positive">
                ↗ +12.4% today
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-title">Auto-Post Status</span>
                <div className={`auto-post-status ${status.autopilot ? '' : 'inactive'}`}>
                  <div className="status-indicator"></div>
                  {status.autopilot ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="metric-value">{status.maxPosts}/day</div>
              <div className="metric-change">
                Next post at {status.postTime} (delay: {status.repostDelay}d)
              </div>
            </div>
          </div>

          <div className="grid-layout">
            <div className="chart-container">
              <div className="chart-header">
                <h2 className="chart-title">Instagram Analytics</h2>
                <div className="chart-controls">
                  <button className="control-btn active" onClick={handleControlBtnClick}>7D</button>
                  <button className="control-btn" onClick={handleControlBtnClick}>30D</button>
                  <button className="control-btn" onClick={handleControlBtnClick}>90D</button>
                </div>
              </div>
              <div className="chart-placeholder">
                <div className="chart-line"></div>
                <canvas ref={instagramCanvasRef} width="800" height="300"></canvas>
              </div>
            </div>

            <div className="activity-feed">
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Recent Activity</h2>
              
              {recentActivity.length === 0 ? (
                <div className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <div className="activity-title">No recent activity</div>
                    <div className="activity-time">Run autopilot to see activity</div>
                  </div>
                </div>
              ) : (
                recentActivity.slice(0, 4).map((activity, index) => {
                  const formatted = formatActivity(activity);
                  return (
                    <div key={activity._id || index} className="activity-item">
                      <div className="activity-dot"></div>
                      <div className="activity-content">
                        <div className="activity-title">
                          <span style={{ marginRight: '0.5rem' }}>{formatted.icon}</span>
                          {formatted.title}
                        </div>
                        <div className="activity-time">{formatted.timeAgo}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* YouTube Data */}
        <div id="youtube-data" className={`platform-data ${currentPlatform === 'youtube' ? 'active' : ''}`}>
          <div className="metrics-grid">
            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Subscribers</span>
                <div className="metric-icon youtube">📺</div>
              </div>
              <div className="metric-value youtube">{stats.youtube.subscribers}</div>
              <div className="metric-change change-positive">
                ↗ +3.8% this month
              </div>
            </div>

            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Watch Time</span>
                <div className="metric-icon youtube">⏱️</div>
              </div>
              <div className="metric-value youtube">{stats.youtube.watchTime}</div>
              <div className="metric-change change-positive">
                ↗ +15.7% hours this week
              </div>
            </div>

            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Views</span>
                <div className="metric-icon youtube">👁️</div>
              </div>
              <div className="metric-value youtube">{stats.youtube.views}</div>
              <div className="metric-change change-positive">
                ↗ +8.3% this week
              </div>
            </div>

            <div className="metric-card youtube">
              <div className="metric-header">
                <span className="metric-title">Auto-Upload</span>
                <div className={`auto-post-status ${status.autopilot ? '' : 'inactive'}`}>
                  <div className="status-indicator"></div>
                  {status.autopilot ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="metric-value youtube">{status.maxPosts}/day</div>
              <div className="metric-change">
                Next upload at {status.postTime} (delay: {status.repostDelay}d)
              </div>
            </div>
          </div>

          <div className="grid-layout">
            <div className="chart-container">
              <div className="chart-header">
                <h2 className="chart-title">YouTube Analytics</h2>
                <div className="chart-controls">
                  <button className="control-btn youtube active" onClick={handleControlBtnClick}>7D</button>
                  <button className="control-btn youtube" onClick={handleControlBtnClick}>30D</button>
                  <button className="control-btn youtube" onClick={handleControlBtnClick}>90D</button>
                </div>
              </div>
              <div className="chart-placeholder youtube">
                <div className="chart-line youtube"></div>
                <canvas ref={youtubeCanvasRef} width="800" height="300"></canvas>
              </div>
            </div>

            <div className="activity-feed">
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Recent Activity</h2>
              
              {recentActivity.length === 0 ? (
                <div className="activity-item">
                  <div className="activity-dot youtube"></div>
                  <div className="activity-content">
                    <div className="activity-title">No recent activity</div>
                    <div className="activity-time">Run autopilot to see activity</div>
                  </div>
                </div>
              ) : (
                recentActivity.slice(0, 4).map((activity, index) => {
                  const formatted = formatActivity(activity);
                  return (
                    <div key={activity._id || index} className="activity-item">
                      <div className="activity-dot youtube"></div>
                      <div className="activity-content">
                        <div className="activity-title">
                          <span style={{ marginRight: '0.5rem' }}>{formatted.icon}</span>
                          {formatted.title}
                        </div>
                        <div className="activity-time">{formatted.timeAgo}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}