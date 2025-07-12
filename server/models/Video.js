const { getDB } = require('../config/database');

class Video {
  static async create(videoData) {
    const db = getDB();
    const { userId, title, description, filePath, fileName, fileSize, duration, resolution, hasAudio, category, propertyType, location, price, tags, aiScore } = videoData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO videos (userId, title, description, filePath, fileName, fileSize, duration, resolution, hasAudio, category, propertyType, location, price, tags, aiScore, postCount, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)',
        [userId, title, description, filePath, fileName, fileSize, duration, resolution, hasAudio ? 1 : 0, category, propertyType, location, price, JSON.stringify(tags), aiScore],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...videoData });
          }
        }
      );
    });
  }

  static async findById(id) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM videos WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row && row.tags) {
              row.tags = JSON.parse(row.tags);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async findByUser(userId) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM videos WHERE userId = ? ORDER BY createdAt DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            rows.forEach(row => {
              if (row.tags) {
                row.tags = JSON.parse(row.tags);
              }
            });
            resolve(rows);
          }
        }
      );
    });
  }

  static async findWithAudio(userId, limit = 10) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM videos WHERE userId = ? AND hasAudio = 1 ORDER BY aiScore DESC LIMIT ?',
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            rows.forEach(row => {
              if (row.tags) {
                row.tags = JSON.parse(row.tags);
              }
            });
            resolve(rows);
          }
        }
      );
    });
  }

  static async updateAiScore(id, aiScore) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE videos SET aiScore = ? WHERE id = ?',
        [aiScore, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  static async getNextVideoForPosting(userId) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      // Get videos that haven't been posted recently (more than 7 days ago or never posted)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      db.get(
        `SELECT * FROM videos 
         WHERE userId = ? AND isActive = 1 
         AND (lastPosted IS NULL OR lastPosted < ?)
         ORDER BY postCount ASC, RANDOM()
         LIMIT 1`,
        [userId, sevenDaysAgo],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row && row.tags) {
              row.tags = JSON.parse(row.tags);
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async markVideoAsPosted(id) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run(
        'UPDATE videos SET postCount = postCount + 1, lastPosted = ? WHERE id = ?',
        [now, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  static async getVideoStats(userId) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      // First, check if postCount column exists, if not, add it
      db.run(`ALTER TABLE videos ADD COLUMN postCount INTEGER DEFAULT 0`, (err) => {
        // Ignore error if column already exists
        
        // Now run the stats query
        db.get(
          `SELECT 
             COUNT(*) as totalVideos,
             COALESCE(SUM(COALESCE(postCount, 0)), 0) as totalPosts,
             COALESCE(AVG(COALESCE(postCount, 0)), 0) as avgPostsPerVideo,
             COUNT(CASE WHEN lastPosted IS NULL THEN 1 END) as unpostedVideos,
             COUNT(CASE WHEN lastPosted < datetime('now', '-7 days') THEN 1 END) as readyToRepost
           FROM videos 
           WHERE userId = ? AND isActive = 1`,
          [userId],
          (err, row) => {
            if (err) {
              console.error('Get videos error:', err);
              // Return default stats if query fails
              resolve({
                totalVideos: 0,
                totalPosts: 0,
                avgPostsPerVideo: 0,
                unpostedVideos: 0,
                readyToRepost: 0
              });
            } else {
              resolve(row);
            }
          }
        );
      });
    });
  }

  static async getStreamPath(id) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT filePath FROM videos WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.filePath : null);
          }
        }
      );
    });
  }

  static async countByUser(userId) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM videos WHERE userId = ? AND isActive = 1',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.count : 0);
          }
        }
      );
    });
  }
}

module.exports = Video; 