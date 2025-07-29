import OpenAI from 'openai';
import YouTubeInsight from '../../models/YouTubeInsight';
import { getTopTrendingKeywords, getTrendingKeywordsByCategory } from './fetchTrendingKeywords';
import { extractCaptionPatterns, getRandomPatternElements, fetchInstagramCompetitorPosts } from './fetchCompetitorCaptions';
import * as fs from 'fs';
import * as path from 'path';

interface CaptionVersion {
  title: string;
  description: string;
  score: number;
  type: 'clickbait' | 'informational' | 'emotional'; // Phase 4: Specific version types
}

export interface SmartCaptionResult {
  versionA: CaptionVersion; // Clickbait hook
  versionB: CaptionVersion; // Educational/Informational tone
  versionC: CaptionVersion; // Story/emotional
}

interface OriginalContent {
  title: string;
  description: string;
  tags: string[];
}

type Platform = 'youtube' | 'instagram';

/**
 * PHASE 4: Generate 3 smart caption versions optimized with competitor patterns and SEO
 * @param originalContent - Original video content
 * @param openaiApiKey - OpenAI API key for GPT requests
 * @param platform - Target platform (youtube or instagram)
 * @returns Three scored caption versions with enhanced SEO and competitor analysis
 */
export async function prepareSmartCaption(
  originalContent: OriginalContent,
  openaiApiKey: string,
  platform: Platform = 'youtube'
): Promise<SmartCaptionResult> {
  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Get top-performing hashtags from YouTube insights
    const topHashtags = await getTopPerformingHashtags();
    
    // PHASE 4: Enhanced SEO and competitor analysis
    const trendingKeywords = await getTopTrendingKeywords(6); // Get 6 for variety
    const buyingKeywords = await getTrendingKeywordsByCategory('buying', 2);
    const marketKeywords = await getTrendingKeywordsByCategory('market', 2);
    const competitorPatterns = await extractCaptionPatterns();
    const patternElements = getRandomPatternElements(competitorPatterns);
    
    // Get platform-specific competitor data
    const instagramPosts = platform === 'instagram' ? await fetchInstagramCompetitorPosts() : [];
    
    // Auto-save channel ID if this is the first API call
    await autoSaveChannelId(platform);
    
    const localSeoTerms = [
      'San Antonio', 'Texas real estate', 'San Antonio homes', 'Texas property',
      'SA realtor', 'South Texas', 'Alamo City', 'Texas market', 'Hill Country'
    ];

    // PHASE 4: Platform-specific optimization rules
    const platformRules = getPlatformSpecificRules(platform, topHashtags, trendingKeywords, localSeoTerms);

    // PHASE 4: Enhanced base prompt with comprehensive SEO and competitor intelligence
    const basePrompt = `
Original Title: ${originalContent.title}
Original Description: ${originalContent.description}
Original Tags: ${originalContent.tags.join(', ')}

${platformRules.criticalRules}

PHASE 4 SEO INTELLIGENCE:
- Top Trending Keywords: ${trendingKeywords.join(', ')}
- Buying Focus Keywords: ${buyingKeywords.join(', ')}
- Market Keywords: ${marketKeywords.join(', ')}
- Local SEO Terms: ${localSeoTerms.join(', ')}
- Top Hashtags: ${topHashtags.join(' ')}

COMPETITOR PATTERN INTELLIGENCE:
- Proven Hook Words: ${competitorPatterns.hookWords.join(', ')}
- High-Engagement Emojis: ${competitorPatterns.emojis.join(' ')}
- Successful Phrases: ${competitorPatterns.commonPhrases.join(', ')}
- Call to Actions: ${competitorPatterns.callToActions.join(', ')}
- SEO Terms from Competitors: ${competitorPatterns.seoTerms.join(', ')}

Selected Pattern Elements: ${JSON.stringify(patternElements)}

${platform === 'instagram' ? `
INSTAGRAM-SPECIFIC PATTERNS (from top performers):
${instagramPosts.slice(0, 3).map(post => `- ${post.caption.substring(0, 100)}...`).join('\n')}
` : ''}

ENHANCED CAPTION OBJECTIVES:
- Maintain core message with fresh, engaging wording
- Naturally weave in 2-3 trending keywords for discoverability
- Use competitor-proven hooks and emotional triggers
- Include strategic local SEO for San Antonio/Texas market
- Add top-performing hashtags for algorithm boost
- Follow proven title structures from successful real estate creators
- Optimize for ${platform} engagement without price conflicts
`;

    const prompts = [
      {
        type: 'clickbait' as const,
        prompt: `${basePrompt}

STYLE: Clickbait Hook (Version A)
OBJECTIVE: Maximum curiosity and click-through rate using competitor-proven formulas

SPECIFIC REQUIREMENTS:
- Start with proven hook: "${patternElements.hookWord}" or similar high-engagement opener
- Use curiosity gap structure: "[Audience] [Action] and [Surprising Result]!"
- MANDATORY: Include these trending SEO keywords naturally: ${trendingKeywords.slice(0,2).join(' + ')} 
- Add strategic emojis: ${patternElements.emoji} and 1-2 others from list
- Focus on transformation/benefit without revealing price
- Keep title under ${platformRules.titleLength} characters for ${platform} optimization
- Include call to action: "${patternElements.callToAction}"
- STRICTLY NO dashes "-" anywhere in text (use spaces/commas instead)
- ABSOLUTELY NO price mentions or dollar amounts

COMPETITOR TITLE STRUCTURE: ${patternElements.titleStructure}

Format: Return ONLY as JSON: {"title": "...", "description": "..."}`,
      },
      {
        type: 'informational' as const,
        prompt: `${basePrompt}

STYLE: Educational/Informational Authority (Version B)  
OBJECTIVE: Position as expert resource using educational hooks

SPECIFIC REQUIREMENTS:
- Use authority opener: "How to", "Why", "The complete guide to", "What [audience] need to know"
- Position as expert with phrases like: "${patternElements.commonPhrase}"
- MANDATORY: Integrate trending keywords naturally: ${trendingKeywords.slice(2,4).join(' + ')}
- MANDATORY: Include market/buying keywords: ${buyingKeywords.concat(marketKeywords).slice(0,2).join(' + ')}
- Professional but approachable tone with competitor emoji style
- Focus on education and value without price discussion
- Include helpful call to action from competitor patterns
- STRICTLY NO dashes "-" anywhere in text (use spaces/commas instead)
- ABSOLUTELY NO price mentions or dollar amounts
- ${platform === 'instagram' ? 'Use Instagram-style engagement hooks like "Save this post!" or "Tag someone who needs this"' : ''}

COMPETITOR AUTHORITY PHRASES: ${competitorPatterns.commonPhrases.slice(0,3).join(', ')}

Format: Return ONLY as JSON: {"title": "...", "description": "..."}`,
      },
      {
        type: 'emotional' as const,
        prompt: `${basePrompt}

STYLE: Story/Emotional Connection (Version C)
OBJECTIVE: Personal story that builds trust and emotional connection

SPECIFIC REQUIREMENTS:
- Start with personal story: "${patternElements.commonPhrase}" or "When I helped..."
- Use emotional triggers (hope, pride, transformation) with trending keywords
- MANDATORY: Include relatable scenarios with: ${trendingKeywords.slice(4,6).join(' + ')}
- Personal pronouns: "my client", "I helped", "their journey"
- Focus on transformation story without revealing numbers
- Include inspiring call to action: "${patternElements.callToAction}"
- Use emotional emojis from competitor analysis: ${competitorPatterns.emojis.slice(5,8).join(' ')}
- STRICTLY NO dashes "-" anywhere in text (use spaces/commas instead)
- ABSOLUTELY NO price mentions or dollar amounts
- ${platform === 'instagram' ? 'Include Instagram storytelling elements like "Swipe to see their journey" or "Their faces said it all"' : ''}

STORY OPENERS: ${competitorPatterns.commonPhrases.filter(p => p.includes('client') || p.includes('helped')).join(', ')}

Format: Return ONLY as JSON: {"title": "...", "description": "..."}`,
      }
    ];

    // Generate all three versions in parallel
    const responses = await Promise.all(
      prompts.map(async ({ prompt, type }) => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 600,
        });
        
        try {
          const content = response.choices[0]?.message?.content || '{}';
          let parsed;
          
          // Try to extract JSON from the response if it's wrapped in other text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            parsed = JSON.parse(content);
          }
          
          // PHASE 4: Clean output - remove dashes and price references
          let cleanTitle = cleanCaptionText(parsed.title || originalContent.title);
          let cleanDescription = cleanCaptionText(parsed.description || originalContent.description);
          
          // Extra cleanup: ensure no JSON artifacts in text
          cleanTitle = cleanTitle.replace(/^["']|["']$/g, '').trim();
          cleanDescription = cleanDescription.replace(/^["']|["']$/g, '').trim();
          
          // Remove any escaped quotes or JSON artifacts
          cleanTitle = cleanTitle.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          cleanDescription = cleanDescription.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          
          return {
            title: cleanTitle,
            description: cleanDescription,
            type
          };
        } catch (parseError) {
          console.error('JSON parsing failed for smart caption:', parseError);
          // Enhanced fallback if JSON parsing fails
          const content = response.choices[0]?.message?.content || '';
          const lines = content.split('\n').filter(line => line.trim());
          const cleanTitle = cleanCaptionText(lines[0] || originalContent.title);
          const cleanDescription = cleanCaptionText(lines.slice(1).join('\n') || originalContent.description);
          
          return {
            title: cleanTitle,
            description: cleanDescription,
            type
          };
        }
      })
    );

    // PHASE 4: Enhanced scoring with competitor pattern analysis
    const versionA: CaptionVersion = {
      ...responses[0],
      score: await scoreCaptionVersion(responses[0], topHashtags, trendingKeywords, 'clickbait', platform)
    };

    const versionB: CaptionVersion = {
      ...responses[1], 
      score: await scoreCaptionVersion(responses[1], topHashtags, trendingKeywords, 'informational', platform)
    };

    const versionC: CaptionVersion = {
      ...responses[2],
      score: await scoreCaptionVersion(responses[2], topHashtags, trendingKeywords, 'emotional', platform)
    };

    // Log Phase 4 completion
    console.log(`✅ PHASE 4 Smart Captions Generated for ${platform.toUpperCase()}:`, {
      keywordsInjected: trendingKeywords.slice(0,3),
      competitorPatterns: Object.keys(patternElements),
      versions: ['clickbait', 'informational', 'emotional'],
      avgScore: Math.round((versionA.score + versionB.score + versionC.score) / 3)
    });

    return { versionA, versionB, versionC };

  } catch (error) {
    console.log(`Error preparing smart caption: ${error}`);
    
    // Enhanced fallback for when OpenAI is unavailable
    const fallbackCaptions = [
      `🏠 Discover your dream home in San Antonio! This stunning property showcases the best of Texas real estate with modern amenities, prime location, and incredible value. Perfect for first-time home buyers, seasoned investors, and anyone looking to make their mark in the thriving San Antonio real estate market. Don't miss this opportunity to own a piece of Texas paradise with excellent schools, shopping, dining, and entertainment nearby. Schedule your showing today!

🎯 WHY CHOOSE SAN ANTONIO? 
✅ Growing job market with Fortune 500 companies
✅ Affordable cost of living compared to major cities  
✅ Rich culture, history, and year-round sunshine
✅ Top-rated schools and family-friendly neighborhoods
✅ World-class dining, entertainment, and sports teams

Ready to make your move? Let's find your perfect home together! 🔑

#realestate #sanantonio #texas #dreamhome #investment #firsttimebuyer #realestateinvesting #texasrealestate #sanantoniohomes #property #realtor #homebuying #luxuryhomes #veteran #sanantoniorealtor #movingtosanantonio`,

      `✨ MUST SEE! This incredible San Antonio property offers everything you've been searching for and more. From stunning architecture to unbeatable location, this is where your real estate dreams come true! Whether you're a first-time buyer, seasoned investor, or looking to upgrade your lifestyle, this property delivers exceptional value in one of Texas's most desirable markets.

🌟 PROPERTY HIGHLIGHTS:
🏡 Prime San Antonio location with easy access to everything
💰 Exceptional value in today's competitive market
🎯 Perfect for investment or primary residence
🚀 Move-in ready with modern updates throughout
🌳 Great neighborhood with top amenities

San Antonio isn't just a city - it's a lifestyle! Join thousands who've discovered why San Antonio is the fastest-growing city in Texas. From the iconic River Walk to world-class dining, from booming job market to family-friendly communities, this is where opportunity meets quality of life.

Ready to call San Antonio home? Let's make it happen! 🏆

#realestate #texas #sanantonio #property #dreamhome #investment #realtor #homebuying #texasrealestate #sanantoniohomes #firsttimebuyer #realestateinvesting #luxuryhomes #newconstruction #movingtotexas`,

      `🔥 HOT PROPERTY ALERT! Don't miss this amazing opportunity in San Antonio's thriving real estate market. This home combines style, comfort, and investment potential in one perfect package! San Antonio continues to be one of the hottest real estate markets in the nation, and properties like this don't last long.

💡 SMART INVESTMENT REASONS:
📈 San Antonio property values up 15% year-over-year
🏢 Major employers like USAA, Valero, H-E-B driving growth  
🎓 Excellent schools including UT San Antonio expansion
🌮 Amazing food scene, culture, and entertainment
⚡ No state income tax - keep more of your money!
🏥 World-class medical facilities and healthcare

This isn't just a house - it's your gateway to the San Antonio lifestyle! From morning coffee on the River Walk to evening Spurs games, from weekend trips to Austin to relaxing in your own backyard oasis. The opportunity is here, the market is hot, and your dream home is waiting.

Don't wait - properties like this are selling fast! Contact us today to schedule your private showing and see why everyone's moving to San Antonio! 🚀

#realestate #sanantonio #texas #investment #property #dreamhome #realtor #homebuying #texasrealestate #firsttimebuyer #realestateinvesting #sanantoniohomes #luxuryhomes #veteran #viral`
    ];
    
    // Select a random fallback caption
    const randomCaption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
    
    return {
      versionA: { 
        title: `Amazing San Antonio Property - ${new Date().getFullYear()}`,
        description: randomCaption,
        score: 75,
        type: 'clickbait' as const
      },
      versionB: { 
        title: `San Antonio Real Estate Opportunity - ${new Date().getFullYear()}`,
        description: randomCaption,
        score: 75,
        type: 'informational' as const
      },
      versionC: { 
        title: `Your Dream Home Awaits - ${new Date().getFullYear()}`,
        description: randomCaption,
        score: 75,
        type: 'emotional' as const
      }
    };
  }
}

/**
 * PHASE 4: Get platform-specific optimization rules
 */
function getPlatformSpecificRules(platform: Platform, topHashtags: string[], trendingKeywords: string[], localSeoTerms: string[]) {
  const baseRules = `
🔒 CRITICAL PHASE 4 RULES - MANDATORY COMPLIANCE:
1. ABSOLUTELY NO PRICING: Never mention dollar amounts ($), costs, prices, or financial figures (price already shown in video)
2. NO DASHES: Never use dashes "-" anywhere in caption text (use commas, periods, or spaces instead)
3. SEO KEYWORD INJECTION: Naturally inject 2-3 trending keywords: ${trendingKeywords.slice(0,3).join(', ')}
4. LOCAL SEO: Include 1-2 local terms: ${localSeoTerms.slice(0,2).join(', ')}
5. TOP HASHTAGS: Include 3-4 performance hashtags: ${topHashtags.slice(0,4).join(' ')}
6. NO CONTRADICTIONS: Must align with video content without revealing specifics
7. PRICE ALTERNATIVES: Use terms like "amazing value", "great opportunity", "incredible deal" instead of numbers
`;

  if (platform === 'instagram') {
    return {
      criticalRules: baseRules + `
8. INSTAGRAM OPTIMIZATION: Use Instagram-specific engagement tactics
9. STORY ELEMENTS: Include "Swipe to see", "Tag someone", "Save this post"
10. COMMUNITY FOCUS: Encourage comments with questions like "Which would you choose?"
11. VISUAL REFERENCES: Reference multiple slides/images when applicable
12. HASHTAG STRATEGY: Use mix of niche and broad hashtags for discovery`,
      titleLength: 125 // Instagram caption length optimization
    };
  } else {
    return {
      criticalRules: baseRules + `
8. YOUTUBE OPTIMIZATION: Focus on searchability and click-through rate
9. VIDEO REFERENCES: Include timestamps and "full tour inside" language
10. RETENTION HOOKS: Create curiosity gaps to increase watch time
11. EDUCATIONAL FOCUS: Position content as valuable learning resource
12. THUMBNAIL ALIGNMENT: Ensure title matches expected thumbnail content`,
      titleLength: 60 // YouTube title length optimization
    };
  }
}

/**
 * PHASE 4: Clean caption text - remove dashes and price references
 */
function cleanCaptionText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove all dashes
  cleaned = cleaned.replace(/-/g, ' ');
  
  // Remove price references (dollars, costs, amounts)
  cleaned = cleaned.replace(/\$[\d,]+(?:\.\d{2})?(?:k|K|m|M)?/g, ''); // $123, $123K, $1.5M
  cleaned = cleaned.replace(/\$[\d,]+/g, ''); // Any dollar amount
  cleaned = cleaned.replace(/\d+k?\s*(dollars?|bucks?)/gi, ''); // 100k dollars
  cleaned = cleaned.replace(/costs?\s*\$?[\d,]+/gi, ''); // costs $123
  cleaned = cleaned.replace(/priced?\s*at\s*\$?[\d,]+/gi, ''); // priced at $123
  cleaned = cleaned.replace(/worth\s*\$?[\d,]+/gi, ''); // worth $123
  cleaned = cleaned.replace(/\$?[\d,]+\s*(million|thousand|k)/gi, ''); // 2.5 million
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Auto-save platform channel/account ID after first API call (Phase 4 requirement)
 * Never ask user for channel ID again once detected
 */
async function autoSaveChannelId(platform: Platform): Promise<void> {
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    const backupPath = path.join(process.cwd(), 'backend', 'settings.json');
    
    // Try main settings first, then backup location
    let settings: any = {};
    let targetPath = settingsPath;
    
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } else if (fs.existsSync(backupPath)) {
      settings = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      targetPath = backupPath;
    }
    
    const settingKey = platform === 'instagram' ? 'instagramAccountId' : 'youtubeChannelId';
    
    // Only save if not already set (avoid asking user again)
    if (!settings[settingKey] || settings[settingKey] === '') {
      // Auto-detect from any previously saved data or use default
      const { getChannelId } = await import('../../models/ChannelSettings');
      const savedChannelId = await getChannelId();
      
      if (savedChannelId) {
        settings[settingKey] = savedChannelId;
        fs.writeFileSync(targetPath, JSON.stringify(settings, null, 2));
        console.log(`✅ ${platform} account ID auto-saved from database:`, savedChannelId);
      } else {
        // Set auto-detection placeholder
        settings[settingKey] = 'AUTO_DETECT_ON_NEXT_API_CALL';
        fs.writeFileSync(targetPath, JSON.stringify(settings, null, 2));
        console.log(`✅ ${platform} account ID set for auto-detection`);
      }
    } else {
      console.log(`✅ ${platform} account ID already configured:`, settings[settingKey]);
    }
  } catch (error) {
    console.error(`Error auto-saving ${platform} account ID:`, error);
  }
}

/**
 * Get top-performing hashtags from YouTube insights
 */
async function getTopPerformingHashtags(): Promise<string[]> {
  try {
    const insights = await YouTubeInsight.find()
      .sort({ avgViewCount: -1, appearances: -1 })
      .limit(25); // Increased for more variety

    const hashtags = insights.map(insight => `#${insight.tag}`);
    
    // Add Phase 4 real estate specific hashtags if not enough found
    const defaultHashtags = [
      '#realestate', '#homebuying', '#property', '#realtor', '#texas',
      '#sanantonio', '#investment', '#firsttimebuyer', '#dreamhome', '#luxuryhomes',
      '#newhomes', '#realestatemarket', '#homesforsale', '#propertyinvestment', '#realtorlife'
    ];
    
    return hashtags.length >= 10 ? hashtags : [...hashtags, ...defaultHashtags].slice(0, 15);
  } catch (error) {
    console.error('Error fetching top hashtags:', error);
    // Enhanced default hashtags for Phase 4
    return [
      '#realestate', '#homebuying', '#property', '#realtor', '#texas',
      '#sanantonio', '#investment', '#firsttimebuyer', '#dreamhome', '#luxuryhomes'
    ];
  }
}

/**
 * PHASE 4: Enhanced caption scoring with SEO and competitor pattern analysis (1-100)
 */
async function scoreCaptionVersion(
  version: { title: string; description: string },
  topHashtags: string[],
  trendingKeywords: string[],
  type: 'clickbait' | 'informational' | 'emotional',
  platform: Platform
): Promise<number> {
  let score = 0;

  // PHASE 4: Hook strength with competitor patterns (25 points)
  const competitorHooks = ['you won\'t believe', 'shocking', 'amazing', 'secret', 'hidden', 'nobody talks', 'how much', 'avoid this', 'just sold', 'pov:', 'wild'];
  const hasCompetitorHook = competitorHooks.some(hook => 
    version.title.toLowerCase().includes(hook) || 
    version.description.toLowerCase().includes(hook)
  );
  score += hasCompetitorHook ? 25 : 10;

  // PHASE 4: SEO keyword integration (30 points)
  const keywordMatches = trendingKeywords.filter(keyword => 
    version.title.toLowerCase().includes(keyword.toLowerCase()) || 
    version.description.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  score += Math.min(keywordMatches * 10, 30);

  // Hashtag optimization (20 points)
  const hashtagCount = topHashtags.filter(hashtag => 
    version.description.includes(hashtag)
  ).length;
  score += Math.min(hashtagCount * 4, 20);

  // Platform-specific length optimization (15 points)
  const titleLength = version.title.length;
  const optimalRange = platform === 'instagram' ? [80, 125] : [30, 60];
  if (titleLength >= optimalRange[0] && titleLength <= optimalRange[1]) score += 15;
  else if (titleLength >= optimalRange[0] - 10 && titleLength <= optimalRange[1] + 20) score += 10;
  else score += 5;

  // PHASE 4: Type-specific scoring with competitor analysis (10 points)
  switch (type) {
    case 'clickbait':
      if (version.title.includes('!') || version.title.includes('?')) score += 5;
      if (/[0-9]/.test(version.title)) score += 5; // Contains numbers
      break;
    case 'informational':
      if (version.title.toLowerCase().includes('how') || 
          version.title.toLowerCase().includes('why') ||
          version.title.toLowerCase().includes('guide') ||
          version.title.toLowerCase().includes('tips')) score += 10;
      break;
    case 'emotional':
      if (version.description.toLowerCase().includes('client') ||
          version.description.toLowerCase().includes('helped') ||
          version.description.toLowerCase().includes('story') ||
          version.description.toLowerCase().includes('journey')) score += 10;
      break;
  }

  // PHASE 4: Platform-specific bonus scoring (5 points)
  if (platform === 'instagram') {
    const instagramElements = ['save this', 'tag someone', 'swipe to', 'comment below', 'drop your guess'];
    const hasInstagramElement = instagramElements.some(element => 
      version.description.toLowerCase().includes(element)
    );
    if (hasInstagramElement) score += 5;
  } else if (platform === 'youtube') {
    const youtubeElements = ['full tour', 'inside', 'breakdown', 'don\'t miss'];
    const hasYoutubeElement = youtubeElements.some(element => 
      version.description.toLowerCase().includes(element)
    );
    if (hasYoutubeElement) score += 5;
  }

  // PHASE 4: Penalty for rule violations
  if (version.title.includes('-') || version.description.includes('-')) score -= 10;
  if (/\$[0-9]/.test(version.title) || /\$[0-9]/.test(version.description)) score -= 20;

  return Math.max(Math.min(score, 100), 0);
} 