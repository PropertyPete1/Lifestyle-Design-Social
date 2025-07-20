export function logStatus(postId: string, status: string) {
  const time = new Date().toISOString();
  console.log(`[${time}] Post ${postId} status: ${status}`);
} 