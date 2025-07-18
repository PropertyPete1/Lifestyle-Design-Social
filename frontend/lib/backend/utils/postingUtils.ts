export function getNextOptimalTime(current: Date): Date {
  const hours = [9, 13, 18]; // 3 optimal times: morning, early afternoon, evening
  const currentHour = current.getHours();

  for (const h of hours) {
    if (currentHour < h) {
      const next = new Date(current);
      next.setHours(h, 0, 0, 0);
      return next;
    }
  }

  const nextDay = new Date(current);
  nextDay.setDate(current.getDate() + 1);
  nextDay.setHours(hours[0], 0, 0, 0);
  return nextDay;
} 