export function getOptimalPostTimes(): Date[] {
  const now = new Date();
  const times = [9, 14, 19]; // 9am, 2pm, 7pm
  return times.map((hour) => {
    const time = new Date(now);
    time.setHours(hour, 0, 0, 0);
    if (time < now) time.setDate(time.getDate() + 1);
    return time;
  });
} 