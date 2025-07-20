export function validateUploadLimit(files: any[]): boolean {
  return files.length <= 30;
} 