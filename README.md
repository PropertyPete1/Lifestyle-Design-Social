# Real Estate Auto-Posting App

A comprehensive cross-platform application for automating real estate content posting across Instagram, TikTok, and YouTube. Built with Node.js, React, and PostgreSQL.

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based with OAuth2 for social platforms
- **Services**: Modular service layer for video processing, AI caption generation, and multi-platform posting
- **APIs**: RESTful APIs with comprehensive error handling and rate limiting

### Frontend (React + Tailwind CSS)
- **UI Framework**: React with Tailwind CSS for luxury real estate styling
- **State Management**: React Context for authentication and app state
- **Charts**: Recharts for analytics visualization
- **File Upload**: React Dropzone for drag-and-drop video uploads

### Multi-Platform Support
- **Instagram**: OAuth2 integration with Instagram Basic Display API
- **TikTok**: TikTok Content Posting API integration
- **YouTube**: YouTube Data API v3 for Shorts posting

## 🚀 Features

### Core Functionality
- **Smart Video Selection**: AI-powered selection based on engagement history and cool-off periods
- **Automated Posting**: 3x daily posting with dynamic scheduling based on engagement data
- **Multi-Platform**: Simultaneous posting to Instagram, TikTok, and YouTube
- **Content Management**: Video library with metadata tracking and organization

### Real Estate Specific
- **Video Types**: Support for both real estate videos and cartoon real estate videos
- **Location Tagging**: Automatic location-based hashtags and captions
- **Market Insights**: Integration with real estate market data
- **Professional Branding**: Luxury real estate focused UI/UX

### AI & Automation
- **Caption Generation**: OpenAI-powered caption generation with real estate context
- **Hashtag Optimization**: Trending hashtag integration and performance tracking
- **Engagement Analysis**: Machine learning for optimal posting times
- **Content Optimization**: AI suggestions for video improvements

### Analytics & Reporting
- **Real-time Analytics**: Comprehensive engagement tracking across platforms
- **Performance Metrics**: Views, likes, comments, shares, and engagement rates
- **Audience Insights**: Demographics and behavior analysis
- **Custom Reports**: Exportable reports for client presentations

## 📋 Prerequisites

### System Requirements
- Node.js 18+ 
- PostgreSQL 14+
- FFmpeg (for video processing)
- Git

### API Keys Required
- **OpenAI API Key**: For AI caption generation
- **Instagram Basic Display API**: For Instagram posting
- **TikTok Content Posting API**: For TikTok posting  
- **YouTube Data API v3**: For YouTube Shorts posting

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/real-estate-auto-posting-app.git
cd real-estate-auto-posting-app
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_posting
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5001/api/oauth/instagram/callback

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:5001/api/oauth/tiktok/callback

# YouTube
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:5001/api/oauth/youtube/callback
```

### 3. Database Setup
```bash
# Create database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd client
npm start
```

## 🎯 Usage

### 1. Initial Setup
1. Register a new account at `http://localhost:3000/register`
2. Connect your social media accounts in Settings → Platforms
3. Upload your first videos in the Videos section
4. Configure your posting schedule in Settings → Schedule

### 2. Video Upload
- **Supported Formats**: MP4, MOV, AVI (max 100MB)
- **Aspect Ratios**: 9:16 (Stories/Reels), 16:9 (YouTube), 1:1 (Instagram)
- **Drag & Drop**: Simply drag videos to the upload area
- **Batch Upload**: Select multiple files for bulk processing

### 3. Auto-Posting Configuration
- **Schedule**: Set posting times (default: 9 AM, 2 PM, 7 PM)
- **Frequency**: 1-5 posts per day
- **Platform Selection**: Choose which platforms to post to
- **Content Mix**: Alternate between real estate and cartoon videos

### 4. Analytics & Monitoring
- **Real-time Dashboard**: View performance metrics
- **Engagement Tracking**: Monitor likes, comments, shares
- **Platform Comparison**: Compare performance across platforms
- **Audience Insights**: Understand your audience demographics

## 🔧 Configuration

### Posting Schedule
```javascript
// Default schedule configuration
{
  enabled: true,
  postsPerDay: 3,
  preferredTimes: ['09:00', '14:00', '19:00'],
  timezone: 'America/Chicago'
}
```

### Content Preferences
```javascript
// Content automation settings
{
  autoGenerateCaptions: true,
  useTrendingHashtags: true,
  includeLocation: true,
  watermark: false
}
```

### Platform Settings
Each platform can be configured independently:
- **Instagram**: Business account required
- **TikTok**: Creator account with Content Posting API access
- **YouTube**: Channel with API access

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Videos
- `GET /api/videos` - List all videos
- `POST /api/videos/upload` - Upload new video
- `GET /api/videos/:id` - Get video details
- `DELETE /api/videos/:id` - Delete video

### Posts
- `GET /api/posts` - List all posts
- `POST /api/posts/schedule` - Schedule new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Analytics
- `GET /api/analytics/overview` - Get overview metrics
- `GET /api/analytics/platforms` - Platform-specific analytics
- `GET /api/analytics/engagement` - Engagement trends

### OAuth
- `GET /api/oauth/:platform/authorize` - Start OAuth flow
- `GET /api/oauth/:platform/callback` - OAuth callback
- `DELETE /api/oauth/:platform/disconnect` - Disconnect platform

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and preferences
- **videos**: Video metadata and processing info
- **posts**: Scheduled and published posts
- **captions**: AI-generated captions
- **hashtags**: Hashtag management
- **engagement_insights**: Performance tracking
- **posting_schedules**: Automated posting configuration

### Relationships
- Users have many videos and posts
- Videos can have multiple posts (different platforms)
- Posts reference videos and platforms
- Engagement insights track post performance

## 🔒 Security

### Authentication
- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Rate limiting on all endpoints
- CORS configuration for frontend

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure file upload handling

### API Security
- OAuth2 for social platform integration
- API key management
- Request signing for external APIs
- Error handling without data leakage

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Configure all production environment variables
2. **Database**: Set up PostgreSQL production database
3. **File Storage**: Configure cloud storage (AWS S3, Google Cloud Storage)
4. **SSL Certificate**: Set up HTTPS
5. **Domain**: Configure custom domain

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your_secure_jwt_secret
```

## 📈 Monitoring & Logging

### Application Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **Database Monitoring**: Query performance analysis
- **Uptime Monitoring**: Service availability tracking

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Rotation**: Automatic log file management
- **Centralized Logging**: Aggregate logs for analysis

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- **Backend**: ESLint with Airbnb config
- **Frontend**: Prettier + ESLint
- **Database**: Consistent naming conventions
- **API**: RESTful design principles

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Getting Help
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support@realestateposting.com

## 🎉 Acknowledgments

- **OpenAI**: For AI caption generation capabilities
- **Instagram/TikTok/YouTube**: For platform APIs
- **React & Node.js Communities**: For excellent documentation and tools
- **Real Estate Professionals**: For domain expertise and feedback

---

**Built with ❤️ for the real estate community**
