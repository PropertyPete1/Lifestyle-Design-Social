import { Pool } from 'pg';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  instagramUsername?: string;
  instagramAccessToken?: string;
  instagramRefreshToken?: string;
  instagramUserId?: string;
  autoPostingEnabled: boolean;
  postingTimes: string[]; // Dynamic posting times
  pinnedHours?: string[]; // User-pinned hours
  excludedHours?: string[]; // Hours to exclude
  timezone: string;
  testMode: boolean; // Post to test account
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  timezone?: string;
}

export interface UserUpdateInput {
  name?: string;
  instagramUsername?: string;
  instagramAccessToken?: string;
  instagramRefreshToken?: string;
  instagramUserId?: string;
  autoPostingEnabled?: boolean;
  postingTimes?: string[];
  pinnedHours?: string[];
  excludedHours?: string[];
  timezone?: string;
  testMode?: boolean;
}

export class UserModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(input: UserCreateInput): Promise<User> {
    const query = `
      INSERT INTO users (email, name, password_hash, timezone, auto_posting_enabled, posting_times, test_mode, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      input.email,
      input.name,
      input.password, // Should be hashed before calling
      input.timezone || 'UTC',
      false, // autoPostingEnabled defaults to false
      JSON.stringify(['09:00', '13:00', '18:00']), // Default posting times
      false // testMode defaults to false
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async update(id: string, input: UserUpdateInput): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async updateInstagramCredentials(
    id: string, 
    credentials: {
      instagramUsername?: string;
      instagramAccessToken?: string;
      instagramRefreshToken?: string;
      instagramUserId?: string;
    }
  ): Promise<User | null> {
    const query = `
      UPDATE users 
      SET 
        instagram_username = $1,
        instagram_access_token = $2,
        instagram_refresh_token = $3,
        instagram_user_id = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const values = [
      credentials.instagramUsername,
      credentials.instagramAccessToken,
      credentials.instagramRefreshToken,
      credentials.instagramUserId,
      id
    ];

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async updatePostingSettings(
    id: string,
    settings: {
      autoPostingEnabled?: boolean;
      postingTimes?: string[];
      pinnedHours?: string[];
      excludedHours?: string[];
      timezone?: string;
      testMode?: boolean;
    }
  ): Promise<User | null> {
    const query = `
      UPDATE users 
      SET 
        auto_posting_enabled = $1,
        posting_times = $2,
        pinned_hours = $3,
        excluded_hours = $4,
        timezone = $5,
        test_mode = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const values = [
      settings.autoPostingEnabled,
      JSON.stringify(settings.postingTimes || []),
      JSON.stringify(settings.pinnedHours || []),
      JSON.stringify(settings.excludedHours || []),
      settings.timezone,
      settings.testMode,
      id
    ];

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async updateLastLogin(id: string): Promise<void> {
    const query = 'UPDATE users SET last_login_at = NOW() WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      instagramUsername: row.instagram_username,
      instagramAccessToken: row.instagram_access_token,
      instagramRefreshToken: row.instagram_refresh_token,
      instagramUserId: row.instagram_user_id,
      autoPostingEnabled: row.auto_posting_enabled,
      postingTimes: JSON.parse(row.posting_times || '[]'),
      pinnedHours: row.pinned_hours ? JSON.parse(row.pinned_hours) : undefined,
      excludedHours: row.excluded_hours ? JSON.parse(row.excluded_hours) : undefined,
      timezone: row.timezone,
      testMode: row.test_mode,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 