-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for Real Estate Auto-Posting App
-- Created: 2024-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    instagram_username VARCHAR(100),
    instagram_access_token TEXT,
    instagram_refresh_token TEXT,
    instagram_user_id VARCHAR(100),
    auto_posting_enabled BOOLEAN DEFAULT false,
    posting_times JSONB DEFAULT '["09:00", "13:00", "18:00"]',
    pinned_hours JSONB DEFAULT '[]',
    excluded_hours JSONB DEFAULT '[]',
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    test_mode BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER, -- in seconds
    thumbnail_path TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'real-estate' CHECK (category IN ('real-estate', 'cartoon')),
    property_type VARCHAR(100),
    location VARCHAR(255),
    price DECIMAL(12, 2),
    tags TEXT[],
    preferred_caption TEXT,
    preferred_hashtags TEXT[],
    preferred_music VARCHAR(255),
    cool_off_days INTEGER DEFAULT 7,
    post_count INTEGER DEFAULT 0,
    last_posted_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok', 'facebook')),
    content TEXT,
    hashtags TEXT[],
    scheduled_time TIMESTAMP NOT NULL,
    posted_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')),
    auto_generated BOOLEAN DEFAULT true,
    content_type VARCHAR(50) DEFAULT 'video' CHECK (content_type IN ('video', 'image', 'story')),
    music_used VARCHAR(255),
    thumbnail_used TEXT,
    engagement_metrics JSONB DEFAULT '{}',
    instagram_post_id VARCHAR(100),
    instagram_permalink TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create captions table
CREATE TABLE captions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tone VARCHAR(50) DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'luxury', 'friendly')),
    style VARCHAR(50) DEFAULT 'engaging' CHECK (style IN ('engaging', 'informative', 'humorous', 'luxury')),
    hashtags TEXT[],
    is_template BOOLEAN DEFAULT false,
    template_name VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create hashtags table
CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hashtag VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'real-estate' CHECK (category IN ('real-estate', 'cartoon', 'general')),
    location VARCHAR(255),
    property_type VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, hashtag)
);

-- Create engagement_insights table
CREATE TABLE engagement_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 4),
    best_posting_hours JSONB,
    best_posting_days JSONB,
    top_performing_hashtags JSONB,
    audience_demographics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posting_schedules table
CREATE TABLE posting_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_name VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(50) DEFAULT 'daily' CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
    posting_times JSONB NOT NULL,
    enabled_days JSONB DEFAULT '[1,2,3,4,5,6,7]', -- 1=Monday, 7=Sunday
    category_rotation JSONB DEFAULT '["real-estate", "cartoon"]',
    posts_per_day INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics_reports table
CREATE TABLE analytics_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
    report_data JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_instagram_username ON users(instagram_username);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_is_active ON videos(is_active);
CREATE INDEX idx_videos_last_posted_at ON videos(last_posted_at);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_video_id ON posts(video_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_time ON posts(scheduled_time);
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_captions_user_id ON captions(user_id);
CREATE INDEX idx_captions_video_id ON captions(video_id);
CREATE INDEX idx_hashtags_user_id ON hashtags(user_id);
CREATE INDEX idx_hashtags_category ON hashtags(category);
CREATE INDEX idx_engagement_insights_user_id ON engagement_insights(user_id);
CREATE INDEX idx_engagement_insights_post_id ON engagement_insights(post_id);
CREATE INDEX idx_posting_schedules_user_id ON posting_schedules(user_id);
CREATE INDEX idx_analytics_reports_user_id ON analytics_reports(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_captions_updated_at BEFORE UPDATE ON captions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hashtags_updated_at BEFORE UPDATE ON hashtags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_insights_updated_at BEFORE UPDATE ON engagement_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posting_schedules_updated_at BEFORE UPDATE ON posting_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO hashtags (user_id, hashtag, category, usage_count) VALUES 
    (uuid_generate_v4(), 'realestate', 'real-estate', 0),
    (uuid_generate_v4(), 'homes', 'real-estate', 0),
    (uuid_generate_v4(), 'property', 'real-estate', 0),
    (uuid_generate_v4(), 'realestateagent', 'real-estate', 0),
    (uuid_generate_v4(), 'homesforsale', 'real-estate', 0),
    (uuid_generate_v4(), 'luxuryhomes', 'real-estate', 0),
    (uuid_generate_v4(), 'dreamhome', 'real-estate', 0),
    (uuid_generate_v4(), 'homebuying', 'real-estate', 0),
    (uuid_generate_v4(), 'realestateinvesting', 'real-estate', 0),
    (uuid_generate_v4(), 'cartoon', 'cartoon', 0),
    (uuid_generate_v4(), 'funny', 'cartoon', 0),
    (uuid_generate_v4(), 'realestatehumor', 'cartoon', 0),
    (uuid_generate_v4(), 'realtorlife', 'cartoon', 0),
    (uuid_generate_v4(), 'realestatecomedy', 'cartoon', 0),
    (uuid_generate_v4(), 'funnyrealtor', 'cartoon', 0); 