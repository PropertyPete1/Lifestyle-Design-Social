"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
class UserModel {
    constructor(pool) {
        this.pool = pool;
    }
    async create(input) {
        const query = `
      INSERT INTO users (email, name, password_hash, timezone, auto_posting_enabled, posting_times, test_mode, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
        const values = [
            input.email,
            input.name,
            input.password,
            input.timezone || 'UTC',
            false,
            JSON.stringify(['09:00', '13:00', '18:00']),
            false
        ];
        const result = await this.pool.query(query, values);
        return this.mapRowToUser(result.rows[0]);
    }
    async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await this.pool.query(query, [id]);
        if (result.rows.length === 0)
            return null;
        return this.mapRowToUser(result.rows[0]);
    }
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await this.pool.query(query, [email]);
        if (result.rows.length === 0)
            return null;
        return this.mapRowToUser(result.rows[0]);
    }
    async update(id, input) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        Object.entries(input).forEach(([key, value]) => {
            if (value !== undefined) {
                fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        if (fields.length === 0)
            return this.findById(id);
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await this.pool.query(query, values);
        if (result.rows.length === 0)
            return null;
        return this.mapRowToUser(result.rows[0]);
    }
    async updateInstagramCredentials(id, credentials) {
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
        if (result.rows.length === 0)
            return null;
        return this.mapRowToUser(result.rows[0]);
    }
    async updatePostingSettings(id, settings) {
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
        if (result.rows.length === 0)
            return null;
        return this.mapRowToUser(result.rows[0]);
    }
    async updateLastLogin(id) {
        const query = 'UPDATE users SET last_login_at = NOW() WHERE id = $1';
        await this.pool.query(query, [id]);
    }
    mapRowToUser(row) {
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
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map