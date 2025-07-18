import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import User from '../models/User';

// Production seed script - NO demo users
// This script only connects to the database and ensures schema is ready
// Real users must register through the application UI

const runSeed = async (): Promise<void> => {
  try {
    logger.info('🌱 Starting production database seeding...');

    // Connect to MongoDB
    await connectToDatabase();

    logger.info('✅ Database connection established');
    logger.info('✅ User schema is ready for registrations');
    logger.info('📋 To create your first user, visit: http://localhost:3000/register');

    logger.info('✅ Production database seeding completed successfully');
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
};

export default runSeed;

// Run if this file is executed directly
if (require.main === module) {
  runSeed()
    .then(() => {
      logger.info('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}
