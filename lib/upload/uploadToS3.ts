import AWS from "aws-sdk";
import { randomUUID } from "crypto";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

export async function uploadToS3(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const key = `videos/${randomUUID()}-${filename}`;

  await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: "public-read",
  }).promise();

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
} 