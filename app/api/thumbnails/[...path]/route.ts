import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const thumbnailPath = params.path.join('/');
    
    // Construct the path to the backend's thumbnails directory
    const backendThumbnailsPath = path.join(
      process.cwd(),
      '..',
      'backend',
      'public',
      'thumbnails',
      thumbnailPath
    );

    // Check if file exists
    if (!fs.existsSync(backendThumbnailsPath)) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(backendThumbnailsPath);
    
    // Determine content type based on file extension
    const ext = path.extname(thumbnailPath).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to serve thumbnail' },
      { status: 500 }
    );
  }
} 