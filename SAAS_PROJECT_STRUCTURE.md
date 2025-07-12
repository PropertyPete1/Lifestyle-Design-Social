# 🏗️ Real Estate Auto-Posting SaaS - Complete Project Structure

## 📁 Root Directory Structure

```
real-estate-auto-posting-saas/
├── 📱 apps/
│   ├── web/                          # Next.js Web App
│   ├── mobile/                       # React Native Mobile App
│   └── api/                          # Node.js + Express + TypeScript Backend
├── 📦 packages/
│   ├── shared/                       # Shared utilities & types
│   ├── ui/                          # Shared UI components
│   └── database/                    # Database schemas & migrations
├── 📋 docs/
│   ├── api/                         # API documentation
│   ├── deployment/                  # Deployment guides
│   └── legal/                       # Terms & Privacy templates
├── 🧪 tests/
│   ├── e2e/                         # End-to-end tests
│   ├── integration/                 # Integration tests
│   └── unit/                        # Unit tests
├── 🚀 infrastructure/
│   ├── aws/                         # AWS deployment configs
│   ├── vercel/                      # Vercel deployment configs
│   └── expo/                        # Expo deployment configs
├── 🔧 tools/
│   ├── scripts/                     # Build & deployment scripts
│   └── config/                      # Shared configuration files
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── package.json                     # Root package.json (workspace)
├── turbo.json                       # Turborepo configuration
└── README.md                        # Project documentation
```

## 🌐 Web Frontend (Next.js + TypeScript)

```
apps/web/
├── 📁 src/
│   ├── app/                         # Next.js 13+ App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── videos/
│   │   │   ├── posts/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── calendar/
│   │   ├── api/                     # API routes (if needed)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Calendar.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── RecentPosts.tsx
│   │   │   ├── PlatformStatus.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── videos/
│   │   │   ├── VideoLibrary.tsx
│   │   │   ├── VideoUpload.tsx
│   │   │   ├── VideoCard.tsx
│   │   │   └── VideoPlayer.tsx
│   │   ├── posts/
│   │   │   ├── PostScheduler.tsx
│   │   │   ├── PostCalendar.tsx
│   │   │   ├── PostList.tsx
│   │   │   └── PostEditor.tsx
│   │   ├── analytics/
│   │   │   ├── EngagementChart.tsx
│   │   │   ├── PlatformComparison.tsx
│   │   │   ├── OptimalTimesChart.tsx
│   │   │   └── PerformanceMetrics.tsx
│   │   └── settings/
│   │       ├── PlatformConnections.tsx
│   │       ├── PostingSchedule.tsx
│   │       ├── APIKeys.tsx
│   │       └── UserProfile.tsx
│   ├── lib/
│   │   ├── api.ts                   # API client functions
│   │   ├── auth.ts                  # Authentication utilities
│   │   ├── utils.ts                 # General utilities
│   │   ├── constants.ts             # App constants
│   │   └── validations.ts           # Form validation schemas
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useAPI.ts                # API calling hook
│   │   ├── useLocalStorage.ts       # Local storage hook
│   │   └── useWebSocket.ts          # WebSocket hook
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Authentication context
│   │   ├── ThemeContext.tsx         # Theme context
│   │   └── NotificationContext.tsx  # Notification context
│   ├── styles/
│   │   ├── globals.css              # Global styles
│   │   └── components.css           # Component-specific styles
│   └── types/
│       ├── api.ts                   # API response types
│       ├── user.ts                  # User-related types
│       ├── video.ts                 # Video-related types
│       └── post.ts                  # Post-related types
├── 📁 public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── next.config.js                   # Next.js configuration
├── tailwind.config.js               # TailwindCSS configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies and scripts
```

## 📱 Mobile Frontend (React Native + Expo)

```
apps/mobile/
├── 📁 src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── VideosScreen.tsx
│   │   │   ├── PostsScreen.tsx
│   │   │   ├── AnalyticsScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── onboarding/
│   │       ├── WelcomeScreen.tsx
│   │       └── TutorialScreen.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── navigation/
│   │   │   ├── TabNavigator.tsx
│   │   │   └── StackNavigator.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── videos/
│   │   │   ├── VideoThumbnail.tsx
│   │   │   ├── VideoUploader.tsx
│   │   │   └── VideoPreview.tsx
│   │   └── posts/
│   │       ├── PostCard.tsx
│   │       ├── PostScheduler.tsx
│   │       └── PostEditor.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── services/
│   │   ├── api.ts                   # API service
│   │   ├── auth.ts                  # Authentication service
│   │   ├── storage.ts               # AsyncStorage service
│   │   ├── notifications.ts         # Push notifications
│   │   └── camera.ts                # Camera/media services
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAPI.ts
│   │   ├── useCamera.ts
│   │   └── useNotifications.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validations.ts
│   │   └── formatters.ts
│   └── types/
│       ├── navigation.ts
│       ├── api.ts
│       └── user.ts
├── 📁 assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── animations/
├── app.json                         # Expo configuration
├── babel.config.js                  # Babel configuration
├── metro.config.js                  # Metro bundler configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies and scripts
```

## 🖥️ Backend API (Node.js + Express + TypeScript)

```
apps/api/
├── 📁 src/
│   ├── controllers/
│   │   ├── authController.ts        # Authentication logic
│   │   ├── userController.ts        # User management
│   │   ├── videoController.ts       # Video operations
│   │   ├── postController.ts        # Post operations
│   │   ├── analyticsController.ts   # Analytics data
│   │   ├── platformController.ts    # Social platform integration
│   │   └── scheduleController.ts    # Posting schedule management
│   ├── routes/
│   │   ├── auth.ts                  # Authentication routes
│   │   ├── users.ts                 # User routes
│   │   ├── videos.ts                # Video routes
│   │   ├── posts.ts                 # Post routes
│   │   ├── analytics.ts             # Analytics routes
│   │   ├── platforms.ts             # Platform routes
│   │   ├── schedule.ts              # Schedule routes
│   │   └── index.ts                 # Route aggregator
│   ├── models/
│   │   ├── User.ts                  # User model
│   │   ├── Video.ts                 # Video model
│   │   ├── Post.ts                  # Post model
│   │   ├── Platform.ts              # Platform model
│   │   ├── Schedule.ts              # Schedule model
│   │   ├── Analytics.ts             # Analytics model
│   │   └── index.ts                 # Model aggregator
│   ├── services/
│   │   ├── authService.ts           # Authentication business logic
│   │   ├── videoService.ts          # Video processing
│   │   ├── postService.ts           # Post management
│   │   ├── analyticsService.ts      # Analytics computation
│   │   ├── platformService.ts       # Social platform APIs
│   │   ├── schedulerService.ts      # Posting scheduler
│   │   ├── aiService.ts             # AI/ML services
│   │   ├── storageService.ts        # File storage (AWS S3)
│   │   └── notificationService.ts   # Push notifications
│   ├── integrations/
│   │   ├── instagram/
│   │   │   ├── instagramAPI.ts      # Instagram Graph API
│   │   │   ├── instagramAuth.ts     # Instagram OAuth
│   │   │   └── instagramTypes.ts    # Instagram type definitions
│   │   ├── tiktok/
│   │   │   ├── tiktokAPI.ts         # TikTok Content API
│   │   │   ├── tiktokAuth.ts        # TikTok OAuth
│   │   │   └── tiktokTypes.ts       # TikTok type definitions
│   │   ├── youtube/
│   │   │   ├── youtubeAPI.ts        # YouTube Data API
│   │   │   ├── youtubeAuth.ts       # YouTube OAuth
│   │   │   └── youtubeTypes.ts      # YouTube type definitions
│   │   └── openai/
│   │       ├── openaiAPI.ts         # OpenAI integration
│   │       └── openaiTypes.ts       # OpenAI type definitions
│   ├── middleware/
│   │   ├── auth.ts                  # Authentication middleware
│   │   ├── validation.ts            # Request validation
│   │   ├── rateLimiting.ts          # Rate limiting
│   │   ├── errorHandler.ts          # Error handling
│   │   ├── cors.ts                  # CORS configuration
│   │   ├── logging.ts               # Request logging
│   │   └── security.ts              # Security headers
│   ├── utils/
│   │   ├── database.ts              # Database utilities
│   │   ├── logger.ts                # Logging utilities
│   │   ├── encryption.ts            # Encryption utilities
│   │   ├── validation.ts            # Validation schemas
│   │   ├── helpers.ts               # General helpers
│   │   ├── constants.ts             # App constants
│   │   └── errors.ts                # Custom error classes
│   ├── config/
│   │   ├── database.ts              # Database configuration
│   │   ├── server.ts                # Server configuration
│   │   ├── aws.ts                   # AWS configuration
│   │   ├── oauth.ts                 # OAuth configurations
│   │   └── environment.ts           # Environment variables
│   ├── jobs/
│   │   ├── postScheduler.ts         # Scheduled posting job
│   │   ├── analyticsSync.ts         # Analytics synchronization
│   │   ├── cleanup.ts               # Database cleanup
│   │   └── notifications.ts         # Notification jobs
│   ├── types/
│   │   ├── api.ts                   # API type definitions
│   │   ├── database.ts              # Database type definitions
│   │   ├── auth.ts                  # Authentication types
│   │   └── integrations.ts          # Integration types
│   └── app.ts                       # Express app setup
├── 📁 database/
│   ├── migrations/                  # Database migrations
│   ├── seeds/                       # Database seeds
│   └── schema.sql                   # Database schema
├── 📁 uploads/                      # File uploads (local dev)
├── 📁 logs/                         # Application logs
├── Dockerfile                       # Docker configuration
├── docker-compose.yml               # Docker Compose for development
├── tsconfig.json                    # TypeScript configuration
├── .env.example                     # Environment variables template
└── package.json                     # Dependencies and scripts
```

## 📦 Shared Packages

### packages/shared/
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.ts                  # Shared user types
│   │   ├── video.ts                 # Shared video types
│   │   ├── post.ts                  # Shared post types
│   │   ├── platform.ts              # Shared platform types
│   │   └── api.ts                   # Shared API types
│   ├── utils/
│   │   ├── validators.ts            # Shared validation functions
│   │   ├── formatters.ts            # Shared formatting functions
│   │   ├── constants.ts             # Shared constants
│   │   └── helpers.ts               # Shared helper functions
│   └── schemas/
│       ├── userSchema.ts            # User validation schemas
│       ├── videoSchema.ts           # Video validation schemas
│       └── postSchema.ts            # Post validation schemas
├── tsconfig.json
└── package.json
```

### packages/ui/
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── Calendar/
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   └── useMediaQuery.ts
│   ├── themes/
│   │   ├── default.ts
│   │   └── dark.ts
│   └── index.ts                     # Component exports
├── tsconfig.json
└── package.json
```

### packages/database/
```
packages/database/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Video.ts
│   │   ├── Post.ts
│   │   └── Platform.ts
│   ├── migrations/
│   │   ├── 001_create_users.ts
│   │   ├── 002_create_videos.ts
│   │   ├── 003_create_posts.ts
│   │   └── 004_create_platforms.ts
│   ├── seeds/
│   │   ├── users.ts
│   │   └── videos.ts
│   ├── config/
│   │   ├── database.ts
│   │   └── migrations.ts
│   └── index.ts
├── tsconfig.json
└── package.json
```

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  mime_type VARCHAR(100),
  category VARCHAR(100) DEFAULT 'real-estate',
  tags TEXT[], -- Array of tags
  is_active BOOLEAN DEFAULT true,
  post_count INTEGER DEFAULT 0,
  last_posted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'tiktok', 'youtube'
  platform_post_id VARCHAR(255), -- ID from the platform
  caption TEXT,
  hashtags TEXT[],
  scheduled_at TIMESTAMP NOT NULL,
  posted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'posted', 'failed', 'cancelled'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  engagement_data JSONB, -- Likes, comments, shares, views
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Platform connections table
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  username VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  scopes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Posting schedules table
CREATE TABLE posting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  days_of_week INTEGER[], -- 0-6 (Sunday-Saturday)
  times_of_day TIME[],
  timezone VARCHAR(100) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, date)
);

-- Captions library table
CREATE TABLE captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  category VARCHAR(100),
  performance_score DECIMAL(3,2), -- 0.00 to 10.00
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Hashtags library table
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  category VARCHAR(100), -- 'real-estate', 'funny', 'trending'
  performance_score DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  is_trending BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API keys table (encrypted)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(100) NOT NULL, -- 'openai', 'cloudinary', etc.
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, service)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_is_active ON videos(is_active);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_analytics_date ON analytics(date);
```

## 🚀 Deployment Structure

### infrastructure/aws/
```
infrastructure/aws/
├── cloudformation/
│   ├── vpc.yaml                     # VPC and networking
│   ├── rds.yaml                     # PostgreSQL database
│   ├── s3.yaml                      # File storage buckets
│   ├── ec2.yaml                     # API server instances
│   ├── cloudfront.yaml              # CDN distribution
│   └── secrets.yaml                 # Secrets Manager
├── scripts/
│   ├── deploy.sh                    # Deployment script
│   ├── backup.sh                    # Database backup script
│   └── rollback.sh                  # Rollback script
└── README.md                        # AWS deployment guide
```

### infrastructure/vercel/
```
infrastructure/vercel/
├── vercel.json                      # Vercel configuration
├── build.sh                        # Build script for web app
└── README.md                        # Vercel deployment guide
```

### infrastructure/expo/
```
infrastructure/expo/
├── eas.json                         # Expo Application Services config
├── app.config.js                    # Dynamic app configuration
├── build.sh                        # Build script for mobile app
└── README.md                        # Expo deployment guide
```

## 📋 Environment Variables Template

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/realestate_autopost
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Social Platform APIs
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
TIKTOK_CLIENT_ID=your-tiktok-client-id
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# AWS Services
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=realestate-autopost-uploads

# File Upload
MAX_FILE_SIZE=100MB
ALLOWED_VIDEO_FORMATS=mp4,mov,avi,mkv

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Environment
NODE_ENV=production
PORT=3001
WEB_URL=https://yourapp.com
API_URL=https://api.yourapp.com
```

This comprehensive structure provides:

✅ **Scalable Architecture**: Monorepo with separate web, mobile, and backend
✅ **Type Safety**: Full TypeScript implementation across all platforms  
✅ **Modern Stack**: Next.js, React Native, Node.js, PostgreSQL
✅ **Production Ready**: Deployment configs for AWS, Vercel, Expo
✅ **Security First**: JWT auth, encrypted API keys, audit logging
✅ **Performance Optimized**: Database indexes, caching, CDN
✅ **Maintainable**: Shared packages, consistent structure, documentation

Ready to implement the next phase? 