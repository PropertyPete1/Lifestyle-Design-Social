import { Request, Response } from 'express';

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    res.status(200).json({ 
      message: 'Video uploaded successfully',
      filename: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading video' });
  }
}; 