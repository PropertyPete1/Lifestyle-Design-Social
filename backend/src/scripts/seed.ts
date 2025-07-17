import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import { User } from '../models/User';

// MongoDB-compatible seed script
const seedData = {
  users: [
    {
      email: 'demo@lifestyledesignrealty.com',
      name: 'Demo User',
      password: 'demo123',
      username: 'demo_realtor',
      autoPostingEnabled: true,
      postingTimes: ['09:00', '13:00', '18:00'],
      timezone: 'America/Chicago',
      testMode: true,
    },
    {
      email: 'test@example.com',
      name: 'Test User',
      password: 'test123',
      autoPostingEnabled: false,
      postingTimes: ['10:00', '14:00', '19:00'],
      timezone: 'America/New_York',
      testMode: true,
    },
  ],
};

const seedUsers = async (): Promise<void> => {
  logger.info('🌱 Seeding users...');
  
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
    logger.info('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Run seed functions
    await seedUsers();
    
    logger.info('✅ Database seeding completed successfully');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Export for use in other files
export { runSeed };

// Run if called directly
if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
} 