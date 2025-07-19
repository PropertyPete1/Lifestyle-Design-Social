import clientPromise from '../mongodb'
import { ObjectId } from 'mongodb'

export const db = {
  instagramPost: {
    async upsert({ where, update, create }: {
      where: { igId: string }
      update: { caption?: string }
      create: {
        igId: string
        caption?: string
        mediaType: string
        mediaUrl: string
        timestamp: string
      }
    }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('instagramPosts')
      
      return collection.updateOne(
        { igId: where.igId },
        { $set: { ...create, ...update } },
        { upsert: true }
      )
    },
    async findMany(options?: {
      where?: { improvedCaption?: { not?: null } }
      orderBy?: { timestamp?: 'desc' }
    }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('instagramPosts')
      
      let filter: any = {}
      if (options?.where?.improvedCaption?.not === null) {
        filter.improvedCaption = { $ne: null }
      }
      
      let cursor = collection.find(filter)
      if (options?.orderBy?.timestamp === 'desc') {
        cursor = cursor.sort({ timestamp: -1 })
      }
      
      return cursor.toArray()
    },
    async findUnique({ where }: { where: { igId: string } }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('instagramPosts')
      
      return collection.findOne({ igId: where.igId })
    },
    async update({ where, data }: {
      where: { igId: string }
      data: { improvedCaption?: string }
    }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('instagramPosts')
      
      return collection.updateOne(
        { igId: where.igId },
        { $set: data }
      )
    }
  },
  scheduledPost: {
    async create({ data }: {
      data: {
        platform: string
        igId: string
        scheduledFor: Date
        title?: string
        description?: string
      }
    }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('scheduledPosts')
      
      return collection.insertOne({
        ...data,
        createdAt: new Date(),
        postedAt: null
      })
    },
    async findMany(options?: {
      where?: {
        postedAt?: null
        scheduledFor?: { lte?: Date }
      }
    }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('scheduledPosts')
      
      let filter: any = {}
      if (options?.where?.postedAt === null) {
        filter.postedAt = null
      }
      if (options?.where?.scheduledFor?.lte) {
        filter.scheduledFor = { $lte: options.where.scheduledFor.lte }
      }
      
      return collection.find(filter).toArray()
    },
    async update({ where, data }: {
      where: { id: string }
      data: { postedAt?: Date }
    }) {
      const client = await clientPromise
      const db = client.db('lifestyle-design-social')
      const collection = db.collection('scheduledPosts')
      
      return collection.updateOne(
        { _id: new ObjectId(where.id) },
        { $set: data }
      )
    }
  }
} 