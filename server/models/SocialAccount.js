const { getDB } = require('../config/database');

class SocialAccount {
  static async upsert({ userId, platform, city, accessToken, username }) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO social_accounts (userId, platform, city, accessToken, username, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(userId, platform, city) DO UPDATE SET accessToken=excluded.accessToken, username=excluded.username, updatedAt=CURRENT_TIMESTAMP`,
        [userId, platform, city, accessToken, username],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  static async findByUserPlatformCity(userId, platform, city) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM social_accounts WHERE userId = ? AND platform = ? AND city = ?',
        [userId, platform, city],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static async getAllForUser(userId) {
    const db = getDB();
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM social_accounts WHERE userId = ?',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = SocialAccount; 