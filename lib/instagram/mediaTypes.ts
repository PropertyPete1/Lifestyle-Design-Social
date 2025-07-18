export type InstagramMediaType = 'REEL' | 'STORY' | 'CAROUSEL' | 'PHOTO';

export function getMediaTypeFromExtension(extension: string): InstagramMediaType {
  switch (extension.toLowerCase()) {
    case 'mp4':
      return 'REEL';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'PHOTO';
    default:
      return 'REEL';
  }
} 