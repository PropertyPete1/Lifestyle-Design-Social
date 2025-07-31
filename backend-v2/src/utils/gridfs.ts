import fs from 'fs';
import { MongoClient, GridFSBucket } from 'mongodb';
import { connectToDatabase } from '../database/connection';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifestyle-design-auto-poster';
const DB_NAME = 'lifestyle-design-auto-poster';

/**
 * Save video file to MongoDB GridFS
 */
export const saveVideoToGridFS = async (filePath: string, fileId: string): Promise<void> => {
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: 'videos' });
  
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(bucket.openUploadStream(fileId, {
        metadata: {
          uploadedAt: new Date(),
          originalPath: filePath
        }
      }))
      .on('finish', () => {
        client.close();
        resolve();
      })
      .on('error', (err) => {
        client.close();
        reject(err);
      });
  });
};

/**
 * Retrieve video file from MongoDB GridFS
 */
export const getVideoFromGridFS = async (fileId: string, outputPath: string): Promise<boolean> => {
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: 'videos' });
  
  return new Promise<boolean>((resolve, reject) => {
    const downloadStream = bucket.openDownloadStreamByName(fileId);
    const writeStream = fs.createWriteStream(outputPath);
    let hasData = false;

    downloadStream.on('data', () => {
      hasData = true;
    });

    downloadStream.on('error', (err) => {
      if (err.message.includes('FileNotFound')) {
        client.close();
        resolve(false);
      } else {
        client.close();
        reject(err);
      }
    });

    downloadStream.pipe(writeStream)
      .on('finish', () => {
        client.close();
        resolve(hasData);
      })
      .on('error', (err) => {
        client.close();
        reject(err);
      });
  });
};

/**
 * Check if video exists in GridFS
 */
export const videoExistsInGridFS = async (fileId: string): Promise<boolean> => {
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: 'videos' });
  
  try {
    const files = await bucket.find({ filename: fileId }).toArray();
    client.close();
    return files.length > 0;
  } catch (error) {
    client.close();
    return false;
  }
};

/**
 * Delete video from GridFS
 */
export const deleteVideoFromGridFS = async (fileId: string): Promise<void> => {
  const client = await MongoClient.connect(MONGO_URI);
  const db = client.db(DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: 'videos' });
  
  try {
    const files = await bucket.find({ filename: fileId }).toArray();
    if (files.length > 0) {
      await bucket.delete(files[0]._id);
    }
    client.close();
  } catch (error) {
    client.close();
    throw error;
  }
};