// 🛠️ Instructions:
// • Create this file exactly at the path above.
// • This utility handles uploading videos to your AWS S3 bucket.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadVideoToS3(fileBuffer: Buffer, mimeType: string): Promise<string> {
  const Key = `${randomUUID()}.mp4`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
} 