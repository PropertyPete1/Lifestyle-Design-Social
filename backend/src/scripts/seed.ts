import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import { User } from '../models/User';

// Production seed script - NO demo users
// This script only connects to the database and ensures schema is ready
// Real users must register through the application UI

const seedData = {
  users: [], // No default users in production
};

const seedUsers = async (): Promise<void> => {
  logger.info('🌱 Production seed - No demo users will be created');
  logger.info('📝 Users must register through the application UI at /register');
  
  // No users to seed - this is intentional for production
  if (seedData.users.length === 0) {
    logger.info('✅ Seed script ready - database will only contain user-registered accounts');
    return;
  }
  
  // This code block will never execute with empty users array
  for (const userData of seedData.users) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        // Create new user
        const newUser = new User({
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          username: userData.username || null,
          autoPostingEnabled: userData.autoPostingEnabled,
          postingTimes: userData.postingTimes,
          timezone: userData.timezone,
          testMode: userData.testMode,
        });
        
        await newUser.save();
        logger.info(`✅ Created user: ${userData.email}`);
      } else {
        logger.info(`⏭️  User already exists: ${userData.email}`);
      }
    } catch (error) {
      logger.error(`❌ Error seeding user ${userData.email}:`, error);
    }
  }
};

const runSeed = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting production database seeding...');
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Run seed functions
    await seedUsers();
    
    logger.info('✅ Production database seeding completed successfully');
    logger.info('📋 To create your first user, visit: http://localhost:3000/register');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
};

export { runSeed, seedUsers };

// Run if called directly
if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('Production seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Production seed script failed:', error);
      process.exit(1);
    });
} 