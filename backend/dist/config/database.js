"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.initialize = exports.pool = void 0;
const pg_1 = require("pg");
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'real_estate_auto_posting',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
const pool = new pg_1.Pool(dbConfig);
exports.pool = pool;
const initializeDatabase = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        instagram_username VARCHAR(255),
        instagram_access_token TEXT,
        instagram_refresh_token TEXT,
        instagram_user_id VARCHAR(255),
        auto_posting_enabled BOOLEAN DEFAULT FALSE,
        posting_times JSONB DEFAULT '["09:00", "13:00", "18:00"]',
        pinned_hours JSONB DEFAULT '[]',
        excluded_hours JSONB DEFAULT '[]',
        timezone VARCHAR(50) DEFAULT 'UTC',
        test_mode BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        duration DECIMAL(10,2),
        resolution VARCHAR(50),
        thumbnail_path VARCHAR(500),
        has_audio BOOLEAN DEFAULT TRUE,
        category VARCHAR(50) NOT NULL CHECK (category IN ('real-estate', 'cartoon')),
        property_type VARCHAR(100),
        location VARCHAR(255),
        price DECIMAL(12,2),
        tags JSONB DEFAULT '[]',
        ai_score DECIMAL(3,2),
        post_count INTEGER DEFAULT 0,
        last_posted_at TIMESTAMP WITH TIME ZONE,
        next_post_date TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        preferred_caption TEXT,
        preferred_hashtags JSONB DEFAULT '[]',
        preferred_music VARCHAR(255),
        cool_off_days INTEGER DEFAULT 30,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook')),
        content TEXT NOT NULL,
        hashtags JSONB DEFAULT '[]',
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')),
        scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
        posted_time TIMESTAMP WITH TIME ZONE,
        auto_generated BOOLEAN DEFAULT TRUE,
        content_type VARCHAR(50) DEFAULT 'video' CHECK (content_type IN ('video', 'image')),
        engagement_metrics JSONB,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        music_used VARCHAR(255),
        thumbnail_used VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS captions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('real-estate', 'cartoon', 'viral')),
        tags JSONB DEFAULT '[]',
        performance_score DECIMAL(3,2),
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hashtag VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('real-estate', 'viral', 'trending')),
        performance_score DECIMAL(3,2),
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, hashtag)
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS engagement_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        engagement_rate DECIMAL(5,4),
        reach_count INTEGER,
        impression_count INTEGER,
        like_count INTEGER,
        comment_count INTEGER,
        share_count INTEGER,
        sample_size INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, hour_of_day, day_of_week)
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS posting_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        posting_times JSONB NOT NULL,
        is_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `);
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
      CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
      CREATE INDEX IF NOT EXISTS idx_videos_last_posted ON videos(last_posted_at);
      CREATE INDEX IF NOT EXISTS idx_videos_post_count ON videos(post_count);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_scheduled_time ON posts(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
      CREATE INDEX IF NOT EXISTS idx_engagement_insights_user_hour ON engagement_insights(user_id, hour_of_day);
      CREATE INDEX IF NOT EXISTS idx_engagement_insights_user_day ON engagement_insights(user_id, day_of_week);
    `);
        console.log('✅ Database schema initialized successfully');
    }
    catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};
const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
const initialize = async () => {
    await testConnection();
    await initializeDatabase();
};
exports.initialize = initialize;
//# sourceMappingURL=database.js.map