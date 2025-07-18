/**
 * Video utility functions for cartoon detection and video processing
 */

/**
 * Determines if a video is a cartoon based on metadata or filename
 * Called before each post to control alternation logic
 * 
 * @param video - Video object with metadata
 * @returns boolean indicating if the video is a cartoon
 */
export function isCartoonVideo(video: any): boolean {
  return video.isCartoon === true || video.filename?.toLowerCase().includes('cartoon');
} 