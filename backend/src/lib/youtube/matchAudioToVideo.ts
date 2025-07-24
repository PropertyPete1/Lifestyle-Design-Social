import OpenAI from 'openai';
import { AudioTrack, getRandomAudioTrack } from './fetchTrendingAudio';

// Audio matching result interface
export interface AudioMatchResult {
  audioTrackId: string | null;
  audioTrack: AudioTrack | null;
  detectedTone: AudioTrack['category'] | null;
  confidence: number; // 0-1 scale
  reasoning: string;
}

// Initialize OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OpenAI API key not found, falling back to keyword matching');
      return null;
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * Analyze video tone using GPT-4
 */
async function analyzeVideoToneWithGPT(
  title: string, 
  description: string, 
  tags: string[] = []
): Promise<{ tone: AudioTrack['category']; confidence: number; reasoning: string }> {
  const client = getOpenAIClient();
  
  if (!client) {
    // Fallback to keyword matching
    return analyzeVideoToneWithKeywords(title, description, tags);
  }

  try {
    const prompt = `Analyze the tone and mood of this YouTube video content and classify it into one of these categories:

CATEGORIES:
- "hype": Energetic, motivational, exciting, action-packed content
- "emotional": Heartfelt, touching, family moments, sentimental content  
- "luxury": Sophisticated, high-end, premium, elegant content
- "funny": Humorous, entertaining, quirky, comedy content
- "chill": Relaxed, peaceful, calm, ambient content

VIDEO CONTENT:
Title: "${title}"
Description: "${description}"
Tags: ${tags.join(', ')}

Respond with ONLY a JSON object in this exact format:
{
  "tone": "category_name",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this category was chosen"
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from GPT');
    }

    const result = JSON.parse(content);
    
    // Validate the response
    const validTones = ['hype', 'emotional', 'luxury', 'funny', 'chill'];
    if (!validTones.includes(result.tone)) {
      throw new Error(`Invalid tone: ${result.tone}`);
    }

    return {
      tone: result.tone as AudioTrack['category'],
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      reasoning: result.reasoning || 'GPT analysis'
    };

  } catch (error) {
    console.error('❌ Error analyzing tone with GPT:', error);
    // Fallback to keyword matching
    return analyzeVideoToneWithKeywords(title, description, tags);
  }
}

/**
 * Fallback keyword-based tone analysis
 */
function analyzeVideoToneWithKeywords(
  title: string, 
  description: string, 
  tags: string[] = []
): { tone: AudioTrack['category']; confidence: number; reasoning: string } {
  const content = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

  // Keyword patterns for each category
  const patterns = {
    luxury: [
      'luxury', 'premium', 'high-end', 'elegant', 'sophisticated', 'exclusive',
      'dream home', 'mansion', 'penthouse', 'upscale', 'elite', 'classy',
      'designer', 'expensive', 'lavish', 'opulent', 'prestigious'
    ],
    funny: [
      'funny', 'hilarious', 'comedy', 'laugh', 'joke', 'humor', 'wild',
      'crazy', 'weird', 'silly', 'ridiculous', 'amusing', 'entertaining',
      'quirky', 'bizarre', 'unexpected', 'surprising'
    ],
    emotional: [
      'family', 'emotional', 'heartfelt', 'touching', 'moving', 'surprise',
      'reunion', 'memories', 'sentimental', 'meaningful', 'personal',
      'story', 'journey', 'life', 'love', 'home', 'children', 'parents'
    ],
    hype: [
      'amazing', 'incredible', 'epic', 'awesome', 'spectacular', 'stunning',
      'unbelievable', 'mind-blowing', 'record-breaking', 'massive', 'huge',
      'success', 'victory', 'achievement', 'breakthrough', 'transformation'
    ],
    chill: [
      'peaceful', 'calm', 'relaxing', 'serene', 'quiet', 'cozy', 'comfortable',
      'gentle', 'soft', 'ambient', 'nature', 'meditation', 'zen', 'spa',
      'retreat', 'vacation', 'escape'
    ]
  };

  // Score each category
  const scores: { [key in AudioTrack['category']]: number } = {
    luxury: 0,
    funny: 0,
    emotional: 0,
    hype: 0,
    chill: 0
  };

  for (const [category, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        scores[category as AudioTrack['category']]++;
      }
    }
  }

  // Find the highest scoring category
  const entries = Object.entries(scores) as [AudioTrack['category'], number][];
  const [topCategory, topScore] = entries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  // Calculate confidence based on score distribution
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = totalScore > 0 ? topScore / totalScore : 0.5;

  // Default to 'chill' if no matches found
  const tone = topScore > 0 ? topCategory : 'chill';
  const matchedKeywords = patterns[tone].filter(keyword => content.includes(keyword));

  return {
    tone,
    confidence: Math.min(confidence, 0.9), // Cap keyword confidence at 0.9
    reasoning: topScore > 0 
      ? `Keyword analysis matched: ${matchedKeywords.slice(0, 3).join(', ')}`
      : 'No specific tone detected, defaulting to chill'
  };
}

/**
 * Main function to match audio to video content
 */
export async function matchAudioToVideo(
  title: string,
  description: string = '',
  tags: string[] = []
): Promise<AudioMatchResult> {
  try {
    console.log('🎵 Analyzing video tone for audio matching...');
    
    // Analyze the video tone
    const { tone, confidence, reasoning } = await analyzeVideoToneWithGPT(title, description, tags);
    
    console.log(`📊 Detected tone: ${tone} (confidence: ${confidence.toFixed(2)})`);
    console.log(`💭 Reasoning: ${reasoning}`);
    
    // Get a random audio track from the detected category
    const audioTrack = await getRandomAudioTrack(tone);
    
    if (!audioTrack) {
      console.warn(`⚠️ No audio tracks found for category: ${tone}`);
      return {
        audioTrackId: null,
        audioTrack: null,
        detectedTone: tone,
        confidence,
        reasoning: `${reasoning} (No audio tracks available for this category)`
      };
    }
    
    console.log(`✅ Matched audio track: ${audioTrack.title}`);
    
    return {
      audioTrackId: audioTrack.audioTrackId,
      audioTrack,
      detectedTone: tone,
      confidence,
      reasoning: `${reasoning} → Matched "${audioTrack.title}"`
    };
    
  } catch (error) {
    console.error('❌ Error matching audio to video:', error);
    
    return {
      audioTrackId: null,
      audioTrack: null,
      detectedTone: null,
      confidence: 0,
      reasoning: `Error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Batch match multiple videos to audio tracks
 */
export async function batchMatchAudioToVideos(
  videos: Array<{ title: string; description?: string; tags?: string[] }>
): Promise<AudioMatchResult[]> {
  console.log(`🎵 Batch matching ${videos.length} videos to audio tracks...`);
  
  const results: AudioMatchResult[] = [];
  
  for (const video of videos) {
    const result = await matchAudioToVideo(
      video.title, 
      video.description, 
      video.tags
    );
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Completed batch audio matching for ${videos.length} videos`);
  
  return results;
} 