"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCompetitorCaptions = fetchCompetitorCaptions;
exports.extractCaptionPatterns = extractCaptionPatterns;
exports.getRandomPatternElements = getRandomPatternElements;
/**
 * PART 4: Fetch and analyze competitor caption patterns
 * Extract successful patterns from top real estate YouTube channels
 */
async function fetchCompetitorCaptions() {
    try {
        // Simulated competitor data (would use YouTube API in production)
        const competitorCaptions = [
            // High-performing real estate channel captions
            {
                channelId: "UC_competitor1",
                videoId: "xyz123",
                title: "You WON'T believe this Texas mansion tour! 🏠✨",
                description: "When my client called about this listing, I knew it was special... Full tour inside! #RealEstate #TexasHomes #LuxuryProperty",
                viewCount: 250000
            },
            {
                channelId: "UC_competitor2",
                videoId: "abc456",
                title: "First time buyers - AVOID this costly mistake! ⚠️",
                description: "I've helped 500+ families buy their first home. Here's the #1 mistake I see... #FirstTimeBuyer #RealEstateTips #HomeBuying",
                viewCount: 180000
            },
            {
                channelId: "UC_competitor3",
                videoId: "def789",
                title: "San Antonio home prices are SHOCKING buyers 😱",
                description: "The market shift nobody saw coming... Are you ready? Full breakdown of what this means for buyers. #SanAntonio #RealEstateMarket",
                viewCount: 165000
            },
            {
                channelId: "UC_competitor1",
                videoId: "ghi012",
                title: "My client got this $400K home for HOW MUCH?! 🤯",
                description: "Negotiation tactics that saved them $30K... Here's exactly what we did (and you can too!) #NegotiationTips #RealEstate",
                viewCount: 142000
            },
            {
                channelId: "UC_competitor2",
                videoId: "jkl345",
                title: "Why smart investors are buying in THESE Texas cities 🎯",
                description: "Data doesn't lie... These 3 markets are about to explode. Are you positioned? #PropertyInvestment #TexasRealEstate",
                viewCount: 128000
            },
            {
                channelId: "UC_competitor3",
                videoId: "mno678",
                title: "New construction vs resale - The TRUTH revealed! 💡",
                description: "After selling both for 10 years, here's what buyers need to know... Full comparison inside. #NewConstruction #HomeBuying",
                viewCount: 115000
            },
            {
                channelId: "UC_competitor1",
                videoId: "pqr901",
                title: "VA loan benefits that NOBODY talks about! 🇺🇸",
                description: "Veterans are missing out on these hidden perks... Don't make this mistake! Full guide below. #VALoan #Veterans #RealEstate",
                viewCount: 98000
            },
            {
                channelId: "UC_competitor2",
                videoId: "stu234",
                title: "This family's home search will AMAZE you! ❤️",
                description: "From apartment to dream home in 90 days... Their journey will inspire you. Behind the scenes tour! #ClientStory #DreamHome",
                viewCount: 87000
            }
        ];
        return competitorCaptions;
    }
    catch (error) {
        console.error('Error fetching competitor captions:', error);
        return [];
    }
}
/**
 * Extract patterns from successful competitor captions
 */
async function extractCaptionPatterns() {
    try {
        const captions = await fetchCompetitorCaptions();
        // Analyze patterns from high-performing captions
        const patterns = {
            hookWords: [
                "You WON'T believe", "SHOCKING", "AVOID this", "The TRUTH",
                "NOBODY talks about", "will AMAZE you", "HIDDEN", "SECRET"
            ],
            emojis: ["🏠", "✨", "⚠️", "😱", "🤯", "🎯", "💡", "🇺🇸", "❤️"],
            titleStructures: [
                "You WON'T believe [subject]!",
                "[Audience] - AVOID this [mistake]!",
                "[Location] [topic] are SHOCKING [audience]",
                "My client got [result] for HOW MUCH?!",
                "Why smart [audience] are [action] in [location]",
                "[Topic] vs [topic] - The TRUTH revealed!",
                "[Benefits] that NOBODY talks about!",
                "This [subject] will AMAZE you!"
            ],
            commonPhrases: [
                "When my client", "Here's exactly what", "Data doesn't lie",
                "After [time period]", "Don't make this mistake", "Full guide below",
                "Behind the scenes", "Will inspire you", "Are you ready?"
            ]
        };
        return patterns;
    }
    catch (error) {
        console.error('Error extracting caption patterns:', error);
        // Fallback patterns
        return {
            hookWords: ["SHOCKING", "AMAZING", "SECRET", "HIDDEN"],
            emojis: ["🏠", "✨", "💡", "🎯"],
            titleStructures: ["You WON'T believe [subject]!", "[Topic] - The TRUTH!"],
            commonPhrases: ["Here's what", "Don't miss this", "Full guide"]
        };
    }
}
/**
 * Get random elements from competitor patterns for caption generation
 */
function getRandomPatternElements(patterns) {
    return {
        hookWord: patterns.hookWords[Math.floor(Math.random() * patterns.hookWords.length)],
        emoji: patterns.emojis[Math.floor(Math.random() * patterns.emojis.length)],
        titleStructure: patterns.titleStructures[Math.floor(Math.random() * patterns.titleStructures.length)],
        commonPhrase: patterns.commonPhrases[Math.floor(Math.random() * patterns.commonPhrases.length)]
    };
}
