export async function publishToYouTube({
  videoUrl,
  caption,
}: {
  videoUrl: string;
  caption: string;
}) {
  return {
    success: true,
    platform: 'youtube',
    videoUrl,
    caption,
  };
} 