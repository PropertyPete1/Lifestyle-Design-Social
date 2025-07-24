import YouTubeInsight from '../../models/YouTubeInsight';

export interface TrendingKeyword {
  phrase: string;
  searchVolume: number;
}

/**
 * PART 4: Fetch trending real estate SEO keywords for caption enhancement
 * These keywords boost discoverability without mentioning prices
 */
export async function fetchTrendingKeywords(): Promise<TrendingKeyword[]> {
  try {
    // Static high-performing real estate search terms (would use Google Trends API in production)
    const staticKeywords: TrendingKeyword[] = [
      { phrase: "first time home buyer", searchVolume: 89000 },
      { phrase: "real estate investing", searchVolume: 76000 },
      { phrase: "home buying tips", searchVolume: 65000 },
      { phrase: "property investment", searchVolume: 58000 },
      { phrase: "mortgage rates", searchVolume: 54000 },
      { phrase: "house hunting", searchVolume: 48000 },
      { phrase: "real estate market", searchVolume: 45000 },
      { phrase: "home selling tips", searchVolume: 42000 },
      { phrase: "VA loan benefits", searchVolume: 38000 },
      { phrase: "Texas real estate", searchVolume: 35000 },
      { phrase: "San Antonio homes", searchVolume: 32000 },
      { phrase: "new construction", searchVolume: 30000 },
      { phrase: "fixer upper", searchVolume: 28000 },
      { phrase: "dream home features", searchVolume: 25000 },
      { phrase: "neighborhood guide", searchVolume: 22000 },
      { phrase: "open house tour", searchVolume: 20000 },
      { phrase: "luxury amenities", searchVolume: 18000 },
      { phrase: "move in ready", searchVolume: 16000 },
      { phrase: "real estate secrets", searchVolume: 14000 },
      { phrase: "property walkthrough", searchVolume: 12000 }
    ];

    // Save trending keywords to database for tracking
    await saveTrendingKeywords(staticKeywords);

    return staticKeywords;

  } catch (error) {
    console.error('Error fetching trending keywords:', error);
    
    // Fallback keywords if database fails
    return [
      { phrase: "real estate tips", searchVolume: 50000 },
      { phrase: "home buying guide", searchVolume: 40000 },
      { phrase: "Texas property", searchVolume: 30000 },
      { phrase: "first time buyer", searchVolume: 25000 },
      { phrase: "San Antonio realtor", searchVolume: 20000 }
    ];
  }
}

/**
 * Get top 3-5 trending keywords for caption injection
 */
export async function getTopTrendingKeywords(limit: number = 5): Promise<string[]> {
  try {
    const keywords = await fetchTrendingKeywords();
    
    // Sort by search volume and return top phrases
    return keywords
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, limit)
      .map(k => k.phrase);

  } catch (error) {
    console.error('Error getting top trending keywords:', error);
    return ["real estate tips", "home buying", "Texas property"];
  }
}

/**
 * Save trending keywords to YouTubeInsight for performance tracking
 */
async function saveTrendingKeywords(keywords: TrendingKeyword[]): Promise<void> {
  try {
    for (const keyword of keywords.slice(0, 10)) { // Save top 10
      await YouTubeInsight.findOneAndUpdate(
        { tag: keyword.phrase.replace(/\s+/g, '_') },
        {
          $set: {
            tag: keyword.phrase.replace(/\s+/g, '_'),
            avgViewCount: keyword.searchVolume,
          },
          $inc: {
            appearances: 1
          }
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    console.error('Error saving trending keywords:', error);
  }
} 