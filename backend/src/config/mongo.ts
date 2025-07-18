import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGODB_URI!

let isConnected = false

export default async function connectMongo() {
  if (isConnected) return
  await mongoose.connect(MONGO_URI, {
    dbName: 'lifestyle-design-social',
  })
  isConnected = true
} 