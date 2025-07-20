export function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getNextPostingSlot(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 4); // example: 4h later
  return now;
} 