import { uploadToS3 as backendUpload } from '@/lib/aws/s3Uploader'

export async function uploadToS3(buffer: Buffer, mimeType: string): Promise<string> {
  return await backendUpload(buffer, mimeType)
} 