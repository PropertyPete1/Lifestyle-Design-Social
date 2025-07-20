const trending = [
  "#realtorsofinstagram",
  "#househunting",
  "#firsttimehomebuyer",
  "#newlisting",
  "#texashomes",
  "#cartoonhouse",
  "#dreamkitchen",
  "#openhouse",
  "#instarealestate",
  "#homesweethome",
];

export function getTrendingHashtags(): string[] {
  const shuffled = trending.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
} 