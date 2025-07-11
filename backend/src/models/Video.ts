import { Pool } from 'pg';

export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration?: number;
  resolution?: string;
  thumbnailPath?: string;
  hasAudio: boolean;
  category: 'real-estate' | 'cartoon';
  propertyType?: string;
  location?: string;
  price?: number;
  tags: string[];
  aiScore?: number;
  postCount: number;
  lastPostedAt?: Date;
  nextPostDate?: Date;
  isActive: boolean;
  preferredCaption?: string;
  preferredHashtags?: string[];
  preferredMusic?: string;
  coolOffDays: number; // Days before video can be reposted
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoCreateInput {
  userId: string;
  title: string;
  description?: string;
  filename: string;
  filePath: string;
  fileSize: number;
  duration?: number;
  resolution?: string;
  hasAudio?: boolean;
  category: 'real-estate' | 'cartoon';
  propertyType?: string;
  location?: string;
  price?: number;
  tags?: string[];
  preferredCaption?: string;
  preferredHashtags?: string[];
  preferredMusic?: string;
  coolOffDays?: number;
}

export interface VideoUpdateInput {
  title?: string;
  description?: string;
  thumbnailPath?: string;
  aiScore?: number;
  isActive?: boolean;
  preferredCaption?: string;
  preferredHashtags?: string[];
  preferredMusic?: string;
  coolOffDays?: number;
}

export class VideoModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(input: VideoCreateInput): Promise<Video> {
    const query = `
      INSERT INTO videos (
        user_id, title, description, filename, file_path, file_size, 
        duration, resolution, has_audio, category, property_type, 
        location, price, tags, preferred_caption, preferred_hashtags, 
        preferred_music, cool_off_days, post_count, is_active, 
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      input.userId,
      input.title,
      input.description,
      input.filename,
      input.filePath,
      input.fileSize,
      input.duration,
      input.resolution,
      input.hasAudio ?? true,
      input.category,
      input.propertyType,
      input.location,
      input.price,
      JSON.stringify(input.tags || []),
      input.preferredCaption,
      JSON.stringify(input.preferredHashtags || []),
      input.preferredMusic,
      input.coolOffDays || 30, // Default 30 days cool-off
      0, // postCount starts at 0
      true // isActive defaults to true
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToVideo(result.rows[0]);
  }

  async findById(id: string): Promise<Video | null> {
    const query = 'SELECT * FROM videos WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async findByUser(userId: string, options?: {
    category?: 'real-estate' | 'cartoon';
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Video[]> {
    let query = 'SELECT * FROM videos WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 1;

    if (options?.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(options.category);
    }

    if (options?.isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      values.push(options.isActive);
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapRowToVideo(row));
  }

  async getNextVideoForPosting(userId: string, category: 'real-estate' | 'cartoon'): Promise<Video | null> {
    const coolOffDate = new Date();
    coolOffDate.setDate(coolOffDate.getDate() - 30); // Default 30 days cool-off

    const query = `
      SELECT * FROM videos 
      WHERE user_id = $1 
        AND category = $2 
        AND is_active = true
        AND (last_posted_at IS NULL OR last_posted_at < $3)
      ORDER BY post_count ASC, RANDOM()
      LIMIT 1
    `;

    const result = await this.pool.query(query, [userId, category, coolOffDate]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async markAsPosted(id: string): Promise<Video | null> {
    const query = `
      UPDATE videos 
      SET 
        post_count = post_count + 1,
        last_posted_at = NOW(),
        next_post_date = NOW() + INTERVAL '1 day' * cool_off_days,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async update(id: string, input: VideoUpdateInput): Promise<Video | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = this.camelToSnake(key);
        if (key === 'preferredHashtags') {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE videos 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async updateAiScore(id: string, aiScore: number): Promise<Video | null> {
    const query = `
      UPDATE videos 
      SET ai_score = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [aiScore, id]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async updateThumbnail(id: string, thumbnailPath: string): Promise<Video | null> {
    const query = `
      UPDATE videos 
      SET thumbnail_path = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [thumbnailPath, id]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async deactivate(id: string): Promise<Video | null> {
    const query = `
      UPDATE videos 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToVideo(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM videos WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getVideoStats(userId: string): Promise<{
    totalVideos: number;
    totalPosts: number;
    avgPostsPerVideo: number;
    unpostedVideos: number;
    readyToRepost: number;
    byCategory: {
      'real-estate': number;
      cartoon: number;
    };
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_videos,
        SUM(post_count) as total_posts,
        AVG(post_count) as avg_posts_per_video,
        COUNT(CASE WHEN last_posted_at IS NULL THEN 1 END) as unposted_videos,
        COUNT(CASE WHEN last_posted_at < NOW() - INTERVAL '1 day' * cool_off_days THEN 1 END) as ready_to_repost,
        COUNT(CASE WHEN category = 'real-estate' THEN 1 END) as real_estate_count,
        COUNT(CASE WHEN category = 'cartoon' THEN 1 END) as cartoon_count
      FROM videos 
      WHERE user_id = $1 AND is_active = true
    `;

    const result = await this.pool.query(query, [userId]);
    const row = result.rows[0];

    return {
      totalVideos: parseInt(row.total_videos) || 0,
      totalPosts: parseInt(row.total_posts) || 0,
      avgPostsPerVideo: parseFloat(row.avg_posts_per_video) || 0,
      unpostedVideos: parseInt(row.unposted_videos) || 0,
      readyToRepost: parseInt(row.ready_to_repost) || 0,
      byCategory: {
        'real-estate': parseInt(row.real_estate_count) || 0,
        cartoon: parseInt(row.cartoon_count) || 0
      }
    };
  }

  private mapRowToVideo(row: any): Video {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      filename: row.filename,
      filePath: row.file_path,
      fileSize: parseInt(row.file_size),
      duration: row.duration ? parseFloat(row.duration) : undefined as any,
      resolution: row.resolution,
      thumbnailPath: row.thumbnail_path,
      hasAudio: row.has_audio,
      category: row.category,
      propertyType: row.property_type,
      location: row.location,
      price: row.price ? parseFloat(row.price) : undefined,
      tags: JSON.parse(row.tags || '[]'),
      aiScore: row.ai_score ? parseFloat(row.ai_score) : undefined,
      postCount: parseInt(row.post_count),
      lastPostedAt: row.last_posted_at ? new Date(row.last_posted_at) : undefined,
      nextPostDate: row.next_post_date ? new Date(row.next_post_date) : undefined,
      isActive: row.is_active,
      preferredCaption: row.preferred_caption,
      preferredHashtags: row.preferred_hashtags ? JSON.parse(row.preferred_hashtags) : undefined,
      preferredMusic: row.preferred_music,
      coolOffDays: parseInt(row.cool_off_days),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 