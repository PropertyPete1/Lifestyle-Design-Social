export function validateSchedule(datetime: Date): boolean {
  const hour = datetime.getHours();
  return hour >= 8 && hour <= 22; // Posting allowed from 8AM to 10PM
} 