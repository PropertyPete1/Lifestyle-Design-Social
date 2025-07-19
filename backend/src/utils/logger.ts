export function log(message: string, data?: unknown) {
  console.log(`[LOG] ${message}`, data || '');
} 