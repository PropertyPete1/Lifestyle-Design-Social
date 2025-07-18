import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifestyle-social'

let isConnected = false

export default async function connectMongo() {
  if (isConnected) return
  
  if (!MONGO_URI) {
    throw new Error('MONGODB_URI environment variable is not defined')
  }
  
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'lifestyle-design-social',
    })
    isConnected = true
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
} 