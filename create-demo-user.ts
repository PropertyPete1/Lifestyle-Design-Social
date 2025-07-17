// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import * as bcrypt from 'bcryptjs';
import { connectToDatabase } from './backend/src/config/database';
import { User } from './backend/src/models/User';

async function createDemoUser(): Promise<void> {
  try {
    console.log('🔧 Creating demo user...');
    
    const email = 'admin@example.com';
    const password = 'password123';
    const name = 'Demo User';
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('✅ Demo user already exists');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   User ID: ${existingUser._id}`);
      return;
    }
    
    // Create new demo user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name,
      autoPostingEnabled: true,
      testMode: true
    });
    
    const savedUser = await newUser.save();
    
    console.log('✅ Demo user created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${savedUser._id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createDemoUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to create demo user:', error);
    process.exit(1);
  }); 