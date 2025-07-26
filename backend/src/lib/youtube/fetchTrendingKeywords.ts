import YouTubeInsight from '../../models/YouTubeInsight';

export interface TrendingKeyword {
  phrase: string;
  searchVolume: number;
  category: string;
}

/**
 * PHASE 4: Enhanced trending real estate SEO keywords for caption optimization
 * Boosts discoverability without mentioning prices, saved to YouTubeInsights.trendingKeywords
 */
export async function fetchTrendingKeywords(): Promise<TrendingKeyword[]> {
  try {
    // Expanded high-performing real estate search terms (would use Google Trends API in production)
    const staticKeywords: TrendingKeyword[] = [
      // Home Buying Keywords
      { phrase: "first time home buyer", searchVolume: 89000, category: "buying" },
      { phrase: "home buying tips", searchVolume: 65000, category: "buying" },
      { phrase: "house hunting", searchVolume: 48000, category: "buying" },
      { phrase: "home buying guide", searchVolume: 42000, category: "buying" },
      { phrase: "VA loan benefits", searchVolume: 38000, category: "buying" },
      { phrase: "mortgage tips", searchVolume: 54000, category: "buying" },
      { phrase: "down payment assistance", searchVolume: 28000, category: "buying" },
      { phrase: "pre approval process", searchVolume: 24000, category: "buying" },
      
      // Investment Keywords  
      { phrase: "real estate investing", searchVolume: 76000, category: "investment" },
      { phrase: "property investment", searchVolume: 58000, category: "investment" },
      { phrase: "rental property", searchVolume: 45000, category: "investment" },
      { phrase: "fix and flip", searchVolume: 32000, category: "investment" },
      { phrase: "real estate portfolio", searchVolume: 26000, category: "investment" },
      { phrase: "passive income", searchVolume: 35000, category: "investment" },
      { phrase: "cash flow properties", searchVolume: 22000, category: "investment" },
      
      // Market & Location Keywords
      { phrase: "real estate market", searchVolume: 45000, category: "market" },
      { phrase: "Texas real estate", searchVolume: 35000, category: "market" },
      { phrase: "San Antonio homes", searchVolume: 32000, category: "market" },
      { phrase: "Austin property market", searchVolume: 28000, category: "market" },
      { phrase: "Dallas real estate", searchVolume: 30000, category: "market" },
      { phrase: "Houston housing market", searchVolume: 25000, category: "market" },
      { phrase: "South Texas properties", searchVolume: 18000, category: "market" },
      
      // Property Types
      { phrase: "new construction", searchVolume: 30000, category: "property" },
      { phrase: "luxury homes", searchVolume: 28000, category: "property" },
      { phrase: "fixer upper", searchVolume: 28000, category: "property" },
      { phrase: "move in ready", searchVolume: 16000, category: "property" },
      { phrase: "custom homes", searchVolume: 24000, category: "property" },
      { phrase: "townhomes", searchVolume: 20000, category: "property" },
      { phrase: "condos for sale", searchVolume: 22000, category: "property" },
      
      // Features & Amenities
      { phrase: "dream home features", searchVolume: 25000, category: "features" },
      { phrase: "luxury amenities", searchVolume: 18000, category: "features" },
      { phrase: "open floor plan", searchVolume: 15000, category: "features" },
      { phrase: "gourmet kitchen", searchVolume: 12000, category: "features" },
      { phrase: "master suite", searchVolume: 14000, category: "features" },
      { phrase: "outdoor living", searchVolume: 16000, category: "features" },
      { phrase: "swimming pool", searchVolume: 13000, category: "features" },
      
      // Selling Keywords
      { phrase: "home selling tips", searchVolume: 42000, category: "selling" },
      { phrase: "staging your home", searchVolume: 18000, category: "selling" },
      { phrase: "listing your property", searchVolume: 15000, category: "selling" },
      { phrase: "home value", searchVolume: 25000, category: "selling" },
      { phrase: "market analysis", searchVolume: 20000, category: "selling" },
      
      // Content & Education
      { phrase: "real estate secrets", searchVolume: 14000, category: "education" },
      { phrase: "property walkthrough", searchVolume: 12000, category: "education" },
      { phrase: "neighborhood guide", searchVolume: 22000, category: "education" },
      { phrase: "open house tour", searchVolume: 20000, category: "education" },
      { phrase: "real estate trends", searchVolume: 18000, category: "education" },
      { phrase: "housing market analysis", searchVolume: 16000, category: "education" }
    ];

    // Save trending keywords to YouTubeInsights for tracking and performance optimization
    await saveTrendingKeywordsToInsights(staticKeywords);

    return staticKeywords;

  } catch (error) {
    console.error('Error fetching trending keywords:', error);
    
    // Enhanced fallback keywords if database fails
    return [
      { phrase: "real estate tips", searchVolume: 50000, category: "general" },
      { phrase: "home buying guide", searchVolume: 40000, category: "buying" },
      { phrase: "Texas property", searchVolume: 30000, category: "market" },
      { phrase: "first time buyer", searchVolume: 25000, category: "buying" },
      { phrase: "San Antonio realtor", searchVolume: 20000, category: "market" },
      { phrase: "property investment", searchVolume: 35000, category: "investment" },
      { phrase: "luxury homes", searchVolume: 28000, category: "property" },
      { phrase: "dream home features", searchVolume: 22000, category: "features" }
    ];
  }
}

/**
 * Get top trending keywords by category for balanced caption injection
 */
export async function getTopTrendingKeywords(limit: number = 5): Promise<string[]> {
  try {
    const keywords = await fetchTrendingKeywords();
    
    // Get diverse keywords from different categories for better SEO
    const categories = ["buying", "investment", "market", "property", "features"];
    const selectedKeywords: string[] = [];
    
    for (const category of categories) {
      const categoryKeywords = keywords
        .filter(k => k.category === category)
        .sort((a, b) => b.searchVolume - a.searchVolume);
      
      if (categoryKeywords.length > 0 && selectedKeywords.length < limit) {
        selectedKeywords.push(categoryKeywords[0].phrase);
      }
    }
    
    // Fill remaining slots with highest volume keywords
    if (selectedKeywords.length < limit) {
      const remaining = keywords
        .filter(k => !selectedKeywords.includes(k.phrase))
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit - selectedKeywords.length)
        .map(k => k.phrase);
      
      selectedKeywords.push(...remaining);
    }

    return selectedKeywords.slice(0, limit);

  } catch (error) {
    console.error('Error getting top trending keywords:', error);
    return ["real estate tips", "home buying", "Texas property", "first time buyer", "property investment"];
  }
}

/**
 * Get trending keywords by specific category for targeted content
 */
export async function getTrendingKeywordsByCategory(category: string, limit: number = 3): Promise<string[]> {
  try {
    const keywords = await fetchTrendingKeywords();
    
    return keywords
      .filter(k => k.category === category)
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, limit)
      .map(k => k.phrase);

  } catch (error) {
    console.error('Error getting keywords by category:', error);
    return ["real estate", "property", "homes"];
  }
}

/**
 * PHASE 4: Save trending keywords to YouTubeInsights.trendingKeywords for performance tracking
 */
async function saveTrendingKeywordsToInsights(keywords: TrendingKeyword[]): Promise<void> {
  try {
    // Get top keywords for saving
    const topKeywords = keywords
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 20)
      .map(k => k.phrase);

    // Save to a dedicated trending keywords insight record
    await YouTubeInsight.findOneAndUpdate(
      { tag: 'trending_keywords_seo' },
      {
        $set: {
          tag: 'trending_keywords_seo',
          trendingKeywords: topKeywords,
          avgViewCount: keywords.reduce((sum, k) => sum + k.searchVolume, 0) / keywords.length,
        },
        $inc: {
          appearances: 1
        }
      },
      { upsert: true, new: true }
    );

    // Also save individual high-performing keywords as separate records
    const topIndividualKeywords = keywords.slice(0, 10);
    for (const keyword of topIndividualKeywords) {
      await YouTubeInsight.findOneAndUpdate(
        { tag: keyword.phrase.replace(/\s+/g, '_') },
        {
          $set: {
            tag: keyword.phrase.replace(/\s+/g, '_'),
            avgViewCount: keyword.searchVolume,
            trendingKeywords: [keyword.phrase]
          },
          $inc: {
            appearances: 1
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Saved ${topKeywords.length} trending keywords to YouTubeInsights`);

  } catch (error) {
    console.error('Error saving trending keywords to insights:', error);
  }
} 