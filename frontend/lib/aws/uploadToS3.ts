import {
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import s3 from './s3';
import { randomUUID } from 'crypto';

export async function uploadToS3(buffer: Buffer, filename: string): Promise<string> {
  const Key = `${randomUUID()}-${filename}`;

  const uploadParams: PutObjectCommandInput = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key,
    Body: buffer,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${process.env.AWS_S3_BUCKET!}.s3.amazonaws.com/${Key}`;
} 