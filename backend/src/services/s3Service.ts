import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export async function uploadToS3(file: Express.Multer.File) {
  const key = `videos/${uuidv4()}-${file.originalname}`;
  await s3
    .putObject({
      Bucket: process.env.AWS_BUCKET!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    })
    .promise();

  return `https://${process.env.AWS_BUCKET!}.s3.${process.env.AWS_REGION!}.amazonaws.com/${key}`;
} 