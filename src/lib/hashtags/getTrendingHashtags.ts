export async function getTrendingHashtags(): Promise<string[]> {
  // These would typically come from an internal analytics source or external API.
  // For now, here's a mock list:
  return [
    '#JustListed',
    '#TexasHomes',
    '#HouseGoals',
    '#FirstTimeBuyer',
    '#HomeTour',
    '#RealEstateTips',
    '#AustinRealEstate',
    '#SanAntonioHomes',
    '#LuxuryListing',
    '#RealEstateVibes',
  ];
} 