export function isPeakHour(currentHour: number, peakHours: number[]) {
  return peakHours.includes(currentHour);
} 