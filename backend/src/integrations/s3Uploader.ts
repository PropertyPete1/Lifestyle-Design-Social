import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'

const s3 = new AWS.S3({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
})

export async function uploadToS3(buffer: Buffer, mimeType: string): Promise<string> {
  const key = `cartoon-videos/${uuidv4()}.mp4`

  await s3
    .putObject({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    })
    .promise()

  return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`
} 