export async function getPeakPostingTimes() {
  // ⚠️ MOCK: Replace with Instagram Insights API (v18+) if available
  return [
    { hour: 11, minute: 30 }, // Late morning
    { hour: 15, minute: 0 },  // Mid-afternoon
    { hour: 20, minute: 30 }, // Evening
  ];
} 