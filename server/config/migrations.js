const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const runMigrations = () => {
  console.log('🔄 Running database migrations...');
  
  // Initialize database connection
  const dbPath = path.join(__dirname, '../../data/app.db');
  const db = new sqlite3.Database(dbPath);
  
  // Helper function to check if column exists
  const columnExists = (tableName, columnName) => {
    return new Promise((resolve) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) {
          resolve(false);
        } else {
          const exists = rows.some(row => row.name === columnName);
          resolve(exists);
        }
      });
    });
  };

  // Helper function to add column if it doesn't exist
  const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      return new Promise((resolve, reject) => {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;
        db.run(sql, (err) => {
          if (err) {
            console.log(`⚠️  Column ${columnName} may already exist in ${tableName}:`, err.message);
            resolve(); // Continue even if column exists
          } else {
            console.log(`✅ Added column ${columnName} to ${tableName}`);
            resolve();
          }
        });
      });
    } else {
      console.log(`✅ Column ${columnName} already exists in ${tableName}`);
    }
  };

  // Run migrations sequentially
  const runAllMigrations = async () => {
    try {
      // Videos table migrations
      await addColumnIfNotExists('videos', 'postCount', 'INTEGER DEFAULT 0');
      await addColumnIfNotExists('videos', 'lastPosted', 'DATETIME');
      await addColumnIfNotExists('videos', 'isActive', 'BOOLEAN DEFAULT 1');
      await addColumnIfNotExists('videos', 'nextPostDate', 'DATETIME');
      await addColumnIfNotExists('videos', 'preferredCaption', 'TEXT');
      await addColumnIfNotExists('videos', 'preferredHashtags', 'TEXT');
      await addColumnIfNotExists('videos', 'preferredMusic', 'TEXT');
      await addColumnIfNotExists('videos', 'coolOffDays', 'INTEGER DEFAULT 7');
      await addColumnIfNotExists('videos', 'thumbnailPath', 'TEXT');

      // Social accounts table migrations
      await addColumnIfNotExists('social_accounts', 'isActive', 'BOOLEAN DEFAULT 1');
      await addColumnIfNotExists('social_accounts', 'lastSync', 'DATETIME');
      await addColumnIfNotExists('social_accounts', 'syncStatus', 'TEXT DEFAULT "connected"');

      // Posts table migrations
      await addColumnIfNotExists('posts', 'engagementRate', 'REAL DEFAULT 0');
      await addColumnIfNotExists('posts', 'impressions', 'INTEGER DEFAULT 0');
      await addColumnIfNotExists('posts', 'reach', 'INTEGER DEFAULT 0');

      console.log('✅ Database migrations completed successfully');
      
      // Close database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        }
      });
      
    } catch (error) {
      console.error('❌ Migration error:', error);
      db.close();
    }
  };

  runAllMigrations();
};

module.exports = { runMigrations }; 