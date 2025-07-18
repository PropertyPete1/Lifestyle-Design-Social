import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

export const processAndUploadVideo = async (filePath: string, originalName: string): Promise<string> => {
  const compressedPath = filePath + '-compressed.mp4';

  await new Promise((resolve, reject) => {
    ffmpeg.setFfmpegPath(ffmpegPath || '');
    ffmpeg(filePath)
      .outputOptions('-crf 28')
      .save(compressedPath)
      .on('end', resolve)
      .on('error', reject);
  });

  const fileContent = fs.readFileSync(compressedPath);
  const uploadResult = await s3.upload({
    Bucket: process.env.S3_BUCKET_NAME || '',
    Key: `videos/${Date.now()}-${path.basename(originalName)}`,
    Body: fileContent,
    ContentType: 'video/mp4'
  }).promise();

  fs.unlinkSync(filePath);
  fs.unlinkSync(compressedPath);
  return uploadResult.Location;
}; 