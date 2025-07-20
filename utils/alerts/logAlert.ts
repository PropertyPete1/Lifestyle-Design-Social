export function logAlert(postId: string, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ALERT for post ${postId}: ${message}`);
} 