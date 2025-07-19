export async function postVideoToPlatform({
  userId,
  platform,
  videoUrl,
  caption,
}: {
  userId: string;
  platform: 'instagram' | 'youtube';
  videoUrl: string;
  caption: string;
}) {
  // Replace this with real API logic
  return {
    status: 'posted',
    platform,
    userId,
    videoUrl,
    caption,
  };
} 