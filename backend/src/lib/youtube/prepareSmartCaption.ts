import OpenAI from 'openai';
import YouTubeInsight from '../../models/YouTubeInsight';
import { getTopTrendingKeywords } from './fetchTrendingKeywords';
import { extractCaptionPatterns, getRandomPatternElements } from './fetchCompetitorCaptions';

interface CaptionVersion {
  title: string;
  description: string;
  score: number;
}

interface SmartCaptionResult {
  versionA: CaptionVersion; // Clickbait hook
  versionB: CaptionVersion; // Educational tone
  versionC: CaptionVersion; // Story/emotional
}

interface OriginalContent {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Generate 3 smart caption versions using GPT and performance scoring
 * @param originalContent - Original YouTube video content
 * @param openaiApiKey - OpenAI API key for GPT requests
 * @returns Three scored caption versions
 */
export async function prepareSmartCaption(
  originalContent: OriginalContent,
  openaiApiKey: string
): Promise<SmartCaptionResult> {
  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Get top-performing hashtags from YouTube insights
    const topHashtags = await getTopPerformingHashtags();
    
    // PART 4: Get trending SEO keywords and competitor patterns
    const trendingKeywords = await getTopTrendingKeywords(5);
    const competitorPatterns = await extractCaptionPatterns();
    const patternElements = getRandomPatternElements(competitorPatterns);
    
    const localSeoTerms = [
      'San Antonio', 'Texas real estate', 'San Antonio homes', 'Texas property',
      'SA realtor', 'South Texas', 'Alamo City', 'Texas market'
    ];

    // PART 4: Enhanced base prompt with SEO keywords and competitor patterns
    const basePrompt = `
Original Title: ${originalContent.title}
Original Description: ${originalContent.description}
Original Tags: ${originalContent.tags.join(', ')}

🔒 CRITICAL RULE: Never mention price points (like $400K, $599,000, etc.) in the caption or title, because the price is already shown inside the video and should not be contradicted.

Top Performing Hashtags: ${topHashtags.join(' ')}
Trending SEO Keywords: ${trendingKeywords.join(', ')}
Local SEO Terms: ${localSeoTerms.join(', ')}
Competitor Hook Words: ${competitorPatterns.hookWords.join(', ')}
Pattern Elements: ${JSON.stringify(patternElements)}

Generate a rewritten version that:
- Maintains the core message but with fresh wording
- Incorporates 2-3 trending SEO keywords naturally for discoverability
- Uses competitor-proven hook words and patterns for engagement
- Includes 1-2 local SEO terms for San Antonio/Texas
- Adds 3-5 top performing hashtags strategically
- 🚫 NEVER mentions any price points or dollar amounts
- Optimizes for YouTube Shorts/Instagram engagement
`;

    const prompts = [
      {
        type: 'clickbait',
        prompt: `${basePrompt}
STYLE: Clickbait Hook
- Start with proven competitor hook words: ${patternElements.hookWord}
- Use urgency and curiosity gaps with trending keywords
- Include competitor-proven emojis: ${patternElements.emoji}
- Focus on benefit/transformation without mentioning prices
- Keep title under 60 characters for mobile
- Inject 1-2 trending SEO keywords: ${trendingKeywords.slice(0,2).join(', ')}

Format: Return ONLY as JSON: {"title": "...", "description": "..."}`,
      },
      {
        type: 'educational',
        prompt: `${basePrompt}
STYLE: Educational/Authority
- Position as expert advice with trending keywords
- Use "How to", "Why", "The truth about" format with SEO phrases
- Include competitor common phrases: ${patternElements.commonPhrase}
- Professional but approachable tone
- Focus on value and learning without price mentions
- Integrate 2-3 trending keywords: ${trendingKeywords.slice(1,4).join(', ')}

Format: Return ONLY as JSON: {"title": "...", "description": "..."}`,
      },
      {
        type: 'story',
        prompt: `${basePrompt}
STYLE: Story/Emotional
- Start with personal story using: ${patternElements.commonPhrase}
- Use emotional triggers with trending keywords (fear, hope, pride)
- Include relatable scenarios with SEO terms
- "When I helped..." or "My client..." format
- Focus on transformation and results without price reveals
- Weave in 1-2 trending keywords: ${trendingKeywords.slice(2,4).join(', ')}

Format: Return ONLY as JSON: {"title": "...", "description": "..."}`,
      }
    ];

    // Generate all three versions in parallel
    const responses = await Promise.all(
      prompts.map(async ({ prompt }) => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 500,
        });
        
        try {
          return JSON.parse(response.choices[0]?.message?.content || '{}');
        } catch {
          // Fallback if JSON parsing fails
          const content = response.choices[0]?.message?.content || '';
          const lines = content.split('\n').filter(line => line.trim());
          return {
            title: lines[0] || originalContent.title,
            description: lines.slice(1).join('\n') || originalContent.description
          };
        }
      })
    );

    // Score each version
    const versionA = {
      ...responses[0],
      score: await scoreCaptionVersion(responses[0], topHashtags, 'clickbait')
    };

    const versionB = {
      ...responses[1],
      score: await scoreCaptionVersion(responses[1], topHashtags, 'educational')
    };

    const versionC = {
      ...responses[2],
      score: await scoreCaptionVersion(responses[2], topHashtags, 'story')
    };

    return { versionA, versionB, versionC };

  } catch (error) {
    console.error('Error preparing smart caption:', error);
    
    // Return fallback versions based on original content
    const fallbackVersion = {
      title: originalContent.title,
      description: originalContent.description,
      score: 50
    };

    return {
      versionA: fallbackVersion,
      versionB: fallbackVersion,
      versionC: fallbackVersion
    };
  }
}

/**
 * Get top-performing hashtags from YouTube insights
 */
async function getTopPerformingHashtags(): Promise<string[]> {
  try {
    const insights = await YouTubeInsight.find()
      .sort({ avgViewCount: -1, appearances: -1 })
      .limit(20);

    return insights.map(insight => `#${insight.tag}`);
  } catch (error) {
    console.error('Error fetching top hashtags:', error);
    // Return default real estate hashtags
    return [
      '#realestate', '#homebuying', '#property', '#realtor', '#texas',
      '#sanantonio', '#investment', '#firsttimebuyer', '#mortgage', '#homes'
    ];
  }
}

/**
 * Score a caption version based on multiple factors (1-100)
 */
async function scoreCaptionVersion(
  version: { title: string; description: string },
  topHashtags: string[],
  type: 'clickbait' | 'educational' | 'story'
): Promise<number> {
  let score = 0;

  // Hook strength (25 points)
  const hookWords = ['you', 'secret', 'shocking', 'amazing', 'never', 'how to', 'why', 'when'];
  const hasHook = hookWords.some(word => 
    version.title.toLowerCase().includes(word) || 
    version.description.toLowerCase().includes(word)
  );
  score += hasHook ? 25 : 10;

  // SEO alignment (25 points)
  const seoTerms = ['texas', 'san antonio', 'real estate', 'homes', 'property', 'realtor'];
  const seoCount = seoTerms.filter(term => 
    version.title.toLowerCase().includes(term) || 
    version.description.toLowerCase().includes(term)
  ).length;
  score += Math.min(seoCount * 5, 25);

  // Hashtag impact (25 points)
  const hashtagCount = topHashtags.filter(hashtag => 
    version.description.includes(hashtag)
  ).length;
  score += Math.min(hashtagCount * 5, 25);

  // Length optimization (15 points)
  const titleLength = version.title.length;
  if (titleLength >= 30 && titleLength <= 60) score += 15;
  else if (titleLength >= 20 && titleLength <= 80) score += 10;
  else score += 5;

  // Type-specific bonuses (10 points)
  switch (type) {
    case 'clickbait':
      if (version.title.includes('!') || version.title.includes('?')) score += 5;
      if (/\d+/.test(version.title)) score += 5; // Contains numbers
      break;
    case 'educational':
      if (version.title.toLowerCase().includes('how') || 
          version.title.toLowerCase().includes('why') ||
          version.title.toLowerCase().includes('guide')) score += 10;
      break;
    case 'story':
      if (version.description.toLowerCase().includes('client') ||
          version.description.toLowerCase().includes('helped') ||
          version.description.toLowerCase().includes('story')) score += 10;
      break;
  }

  return Math.min(score, 100);
} 