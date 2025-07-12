const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

class User {
  static async create(userData) {
    const db = getDB();
    const { email, password, name } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email.toLowerCase(), hashedPassword, name],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, email, name });
          }
        }
      );
    });
  }

  static async findByEmail(email) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase()],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  static async findById(id) {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            // Parse postingTimes if it's a string
            if (row && typeof row.postingTimes === 'string') {
              try {
                row.postingTimes = JSON.parse(row.postingTimes);
              } catch (e) {
                row.postingTimes = ['09:00', '12:00', '18:00'];
              }
            }
            resolve(row);
          }
        }
      );
    });
  }

  static async updateAutoPostingSettings(userId, settings) {
    const db = getDB();
    const { autoPostingEnabled, cameraRollPath, postingTimes } = settings;
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET autoPostingEnabled = ?, cameraRollPath = ?, postingTimes = ? WHERE id = ?',
        [autoPostingEnabled ? 1 : 0, cameraRollPath, JSON.stringify(postingTimes), userId],
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

  static async findWithAutoPostingEnabled() {
    const db = getDB();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM users WHERE autoPostingEnabled = 1',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  static async toJSON(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = User; 