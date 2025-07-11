"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPostingSchedules = exports.seedHashtags = exports.seedCaptions = exports.seedVideos = exports.seedUsers = exports.runSeed = void 0;
const pg_1 = require("pg");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
const pool = new pg_1.Pool({
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'real_estate_auto_posting',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
});
const seedData = {
    users: [
        {
            email: 'demo@lifestyledesignrealty.com',
            name: 'Demo User',
            password: 'demo123',
            instagram_username: 'demo_realtor',
            auto_posting_enabled: true,
            posting_times: ['09:00', '13:00', '18:00'],
            timezone: 'America/Chicago',
            test_mode: true,
        },
        {
            email: 'test@example.com',
            name: 'Test User',
            password: 'test123',
            auto_posting_enabled: false,
            posting_times: ['10:00', '14:00', '19:00'],
            timezone: 'America/New_York',
            test_mode: true,
        },
    ],
    videos: [
        {
            title: 'Luxury Home Tour - Austin, TX',
            description: 'Stunning 4-bedroom luxury home in the heart of Austin. Features include gourmet kitchen, pool, and mountain views.',
            filename: 'luxury-home-austin.mp4',
            file_path: '/uploads/videos/luxury-home-austin.mp4',
            file_size: 52428800,
            duration: 180,
            category: 'real-estate',
            property_type: 'house',
            location: 'Austin, TX',
            price: 1250000,
            tags: ['luxury', 'austin', 'pool', 'mountain-views'],
            preferred_caption: '🏠 Luxury Home Tour in Austin, TX\n\n📍 Location: Austin, TX\n🏘️ Type: House\n💰 Price: $1,250,000\n\nStunning 4-bedroom luxury home with gourmet kitchen, pool, and mountain views! 💎\n\n#luxuryhomes #austin #realestate #dreamhome',
            preferred_hashtags: ['luxuryhomes', 'austin', 'realestate', 'dreamhome', 'luxury', 'pool', 'mountainviews'],
            cool_off_days: 7,
        },
        {
            title: 'Funny Real Estate Agent Cartoon',
            description: 'Hilarious cartoon about the daily life of a real estate agent. Perfect for social media engagement!',
            filename: 'funny-realtor-cartoon.mp4',
            file_path: '/uploads/videos/funny-realtor-cartoon.mp4',
            file_size: 20971520,
            duration: 60,
            category: 'cartoon',
            property_type: 'cartoon',
            location: 'Cartoon World',
            tags: ['funny', 'cartoon', 'realtor', 'humor'],
            preferred_caption: '😂 Real estate life be like...\n\nWhen your client asks for a "cozy" home but means "tiny" 😅\n\n#realestatehumor #funnyrealtor #cartoon #realtorlife',
            preferred_hashtags: ['realestatehumor', 'funnyrealtor', 'cartoon', 'realtorlife', 'funny'],
            cool_off_days: 5,
        },
        {
            title: 'Modern Condo - Downtown Dallas',
            description: 'Contemporary 2-bedroom condo in the heart of downtown Dallas. Walking distance to restaurants and shopping.',
            filename: 'modern-condo-dallas.mp4',
            file_path: '/uploads/videos/modern-condo-dallas.mp4',
            file_size: 31457280,
            duration: 120,
            category: 'real-estate',
            property_type: 'condo',
            location: 'Dallas, TX',
            price: 450000,
            tags: ['modern', 'dallas', 'downtown', 'condo'],
            preferred_caption: '🏢 Modern Condo in Downtown Dallas\n\n📍 Location: Dallas, TX\n🏘️ Type: Condo\n💰 Price: $450,000\n\nContemporary 2-bedroom condo walking distance to restaurants and shopping! 🏙️\n\n#dallas #condo #downtown #realestate #modern',
            preferred_hashtags: ['dallas', 'condo', 'downtown', 'realestate', 'modern', 'walkingdistance'],
            cool_off_days: 7,
        },
    ],
    captions: [
        {
            content: '🏠 {title}\n\n📍 {location}\n🏘️ {propertyType}\n💰 {price}\n\n{description}\n\n#luxuryhomes #realestate #dreamhome',
            tone: 'luxury',
            style: 'engaging',
            hashtags: ['luxuryhomes', 'realestate', 'dreamhome'],
            is_template: true,
            template_name: 'Luxury Property Template',
        },
        {
            content: 'Check out this amazing {propertyType} in {location}! {description}\n\nWhat do you think? 👇\n\n#realestate #homes #property',
            tone: 'casual',
            style: 'engaging',
            hashtags: ['realestate', 'homes', 'property'],
            is_template: true,
            template_name: 'Casual Property Template',
        },
        {
            content: '😂 {title}\n\n{description}\n\nReal estate life be like... 😅\n\n#realestatehumor #funnyrealtor #cartoon',
            tone: 'friendly',
            style: 'humorous',
            hashtags: ['realestatehumor', 'funnyrealtor', 'cartoon'],
            is_template: true,
            template_name: 'Funny Cartoon Template',
        },
    ],
    hashtags: [
        { hashtag: 'realestate', category: 'real-estate', usage_count: 0 },
        { hashtag: 'homes', category: 'real-estate', usage_count: 0 },
        { hashtag: 'property', category: 'real-estate', usage_count: 0 },
        { hashtag: 'realestateagent', category: 'real-estate', usage_count: 0 },
        { hashtag: 'homesforsale', category: 'real-estate', usage_count: 0 },
        { hashtag: 'luxuryhomes', category: 'real-estate', usage_count: 0 },
        { hashtag: 'dreamhome', category: 'real-estate', usage_count: 0 },
        { hashtag: 'homebuying', category: 'real-estate', usage_count: 0 },
        { hashtag: 'realestateinvesting', category: 'real-estate', usage_count: 0 },
        { hashtag: 'openhouse', category: 'real-estate', usage_count: 0 },
        { hashtag: 'justlisted', category: 'real-estate', usage_count: 0 },
        { hashtag: 'austin', category: 'real-estate', location: 'Austin, TX', usage_count: 0 },
        { hashtag: 'dallas', category: 'real-estate', location: 'Dallas, TX', usage_count: 0 },
        { hashtag: 'houston', category: 'real-estate', location: 'Houston, TX', usage_count: 0 },
        { hashtag: 'sanantonio', category: 'real-estate', location: 'San Antonio, TX', usage_count: 0 },
        { hashtag: 'house', category: 'real-estate', property_type: 'house', usage_count: 0 },
        { hashtag: 'condo', category: 'real-estate', property_type: 'condo', usage_count: 0 },
        { hashtag: 'townhouse', category: 'real-estate', property_type: 'townhouse', usage_count: 0 },
        { hashtag: 'apartment', category: 'real-estate', property_type: 'apartment', usage_count: 0 },
        { hashtag: 'cartoon', category: 'cartoon', usage_count: 0 },
        { hashtag: 'funny', category: 'cartoon', usage_count: 0 },
        { hashtag: 'realestatehumor', category: 'cartoon', usage_count: 0 },
        { hashtag: 'realtorlife', category: 'cartoon', usage_count: 0 },
        { hashtag: 'realestatecomedy', category: 'cartoon', usage_count: 0 },
        { hashtag: 'funnyrealtor', category: 'cartoon', usage_count: 0 },
        { hashtag: 'realestatejokes', category: 'cartoon', usage_count: 0 },
        { hashtag: 'realtorproblems', category: 'cartoon', usage_count: 0 },
        { hashtag: 'realestatememes', category: 'cartoon', usage_count: 0 },
    ],
    posting_schedules: [
        {
            schedule_name: 'Default Schedule',
            schedule_type: 'daily',
            posting_times: ['09:00', '13:00', '18:00'],
            enabled_days: [1, 2, 3, 4, 5, 6, 7],
            category_rotation: ['real-estate', 'cartoon'],
            posts_per_day: 3,
            is_active: true,
        },
        {
            schedule_name: 'Weekend Schedule',
            schedule_type: 'daily',
            posting_times: ['10:00', '15:00', '20:00'],
            enabled_days: [6, 7],
            category_rotation: ['real-estate', 'cartoon'],
            posts_per_day: 2,
            is_active: true,
        },
    ],
};
const seedUsers = async () => {
    const client = await pool.connect();
    try {
        logger_1.logger.info('Seeding users...');
        for (const userData of seedData.users) {
            const passwordHash = await bcryptjs_1.default.hash(userData.password, 12);
            const result = await client.query(`
        INSERT INTO users (
          email, name, password_hash, instagram_username, 
          auto_posting_enabled, posting_times, timezone, test_mode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `, [
                userData.email,
                userData.name,
                passwordHash,
                userData.instagram_username,
                userData.auto_posting_enabled,
                JSON.stringify(userData.posting_times),
                userData.timezone,
                userData.test_mode,
            ]);
            if (result.rows.length > 0) {
                logger_1.logger.info(`Created user: ${userData.email}`);
            }
            else {
                logger_1.logger.info(`User already exists: ${userData.email}`);
            }
        }
    }
    finally {
        client.release();
    }
};
exports.seedUsers = seedUsers;
const seedVideos = async () => {
    const client = await pool.connect();
    try {
        logger_1.logger.info('Seeding videos...');
        const userResult = await client.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            logger_1.logger.error('No users found. Please seed users first.');
            return;
        }
        const userId = userResult.rows[0].id;
        for (const videoData of seedData.videos) {
            const result = await client.query(`
        INSERT INTO videos (
          user_id, title, description, filename, file_path, file_size,
          duration, category, property_type, location, price, tags,
          preferred_caption, preferred_hashtags, cool_off_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
                userId,
                videoData.title,
                videoData.description,
                videoData.filename,
                videoData.file_path,
                videoData.file_size,
                videoData.duration,
                videoData.category,
                videoData.property_type,
                videoData.location,
                videoData.price,
                videoData.tags,
                videoData.preferred_caption,
                videoData.preferred_hashtags,
                videoData.cool_off_days,
            ]);
            if (result.rows.length > 0) {
                logger_1.logger.info(`Created video: ${videoData.title}`);
            }
            else {
                logger_1.logger.info(`Video already exists: ${videoData.title}`);
            }
        }
    }
    finally {
        client.release();
    }
};
exports.seedVideos = seedVideos;
const seedCaptions = async () => {
    const client = await pool.connect();
    try {
        logger_1.logger.info('Seeding captions...');
        const userResult = await client.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            logger_1.logger.error('No users found. Please seed users first.');
            return;
        }
        const userId = userResult.rows[0].id;
        for (const captionData of seedData.captions) {
            const result = await client.query(`
        INSERT INTO captions (
          user_id, content, tone, style, hashtags, is_template, template_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
                userId,
                captionData.content,
                captionData.tone,
                captionData.style,
                captionData.hashtags,
                captionData.is_template,
                captionData.template_name,
            ]);
            if (result.rows.length > 0) {
                logger_1.logger.info(`Created caption template: ${captionData.template_name}`);
            }
            else {
                logger_1.logger.info(`Caption template already exists: ${captionData.template_name}`);
            }
        }
    }
    finally {
        client.release();
    }
};
exports.seedCaptions = seedCaptions;
const seedHashtags = async () => {
    const client = await pool.connect();
    try {
        logger_1.logger.info('Seeding hashtags...');
        const userResult = await client.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            logger_1.logger.error('No users found. Please seed users first.');
            return;
        }
        const userId = userResult.rows[0].id;
        for (const hashtagData of seedData.hashtags) {
            const result = await client.query(`
        INSERT INTO hashtags (
          user_id, hashtag, category, location, property_type, usage_count
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, hashtag) DO NOTHING
        RETURNING id
      `, [
                userId,
                hashtagData.hashtag,
                hashtagData.category,
                hashtagData.location || null,
                hashtagData.property_type || null,
                hashtagData.usage_count,
            ]);
            if (result.rows.length > 0) {
                logger_1.logger.info(`Created hashtag: ${hashtagData.hashtag}`);
            }
            else {
                logger_1.logger.info(`Hashtag already exists: ${hashtagData.hashtag}`);
            }
        }
    }
    finally {
        client.release();
    }
};
exports.seedHashtags = seedHashtags;
const seedPostingSchedules = async () => {
    const client = await pool.connect();
    try {
        logger_1.logger.info('Seeding posting schedules...');
        const userResult = await client.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            logger_1.logger.error('No users found. Please seed users first.');
            return;
        }
        const userId = userResult.rows[0].id;
        for (const scheduleData of seedData.posting_schedules) {
            const result = await client.query(`
        INSERT INTO posting_schedules (
          user_id, schedule_name, schedule_type, posting_times,
          enabled_days, category_rotation, posts_per_day, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
                userId,
                scheduleData.schedule_name,
                scheduleData.schedule_type,
                JSON.stringify(scheduleData.posting_times),
                JSON.stringify(scheduleData.enabled_days),
                JSON.stringify(scheduleData.category_rotation),
                scheduleData.posts_per_day,
                scheduleData.is_active,
            ]);
            if (result.rows.length > 0) {
                logger_1.logger.info(`Created posting schedule: ${scheduleData.schedule_name}`);
            }
            else {
                logger_1.logger.info(`Posting schedule already exists: ${scheduleData.schedule_name}`);
            }
        }
    }
    finally {
        client.release();
    }
};
exports.seedPostingSchedules = seedPostingSchedules;
const runSeed = async () => {
    try {
        logger_1.logger.info('Starting database seeding...');
        await seedUsers();
        await seedVideos();
        await seedCaptions();
        await seedHashtags();
        await seedPostingSchedules();
        logger_1.logger.info('Database seeding completed successfully!');
        logger_1.logger.info('\nDemo credentials:');
        logger_1.logger.info('Email: demo@lifestyledesignrealty.com');
        logger_1.logger.info('Password: demo123');
    }
    catch (error) {
        logger_1.logger.error('Seeding failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
};
exports.runSeed = runSeed;
if (require.main === module) {
    runSeed();
}
//# sourceMappingURL=seed.js.map