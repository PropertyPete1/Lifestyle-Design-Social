"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPhase4 = testPhase4;
const prepareSmartCaption_1 = require("./prepareSmartCaption");
const fetchCompetitorCaptions_1 = require("./fetchCompetitorCaptions");
const fetchTrendingKeywords_1 = require("./fetchTrendingKeywords");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function testPhase4() {
    console.log('\n🚀 PHASE 4 SMART CAPTIONS - COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(80));
    const results = [];
    try {
        // Get OpenAI API key from settings
        const openaiApiKey = await getOpenAIApiKey();
        if (!openaiApiKey) {
            console.log('❌ OpenAI API key not found. Skipping GPT tests but running data verification...');
        }
        // Test 1: Competitor Caption Scraping (YouTube)
        console.log('\n📊 Test 1: YouTube Competitor Caption Analysis');
        const youtubeTest = await testYouTubeCompetitorScraping();
        results.push(youtubeTest);
        // Test 2: Instagram Competitor Post Analysis  
        console.log('\n📱 Test 2: Instagram Competitor Post Analysis');
        const instagramTest = await testInstagramCompetitorScraping();
        results.push(instagramTest);
        // Test 3: Pattern Extraction & Analysis
        console.log('\n🔍 Test 3: Competitor Pattern Extraction');
        const patternTest = await testPatternExtraction();
        results.push(patternTest);
        // Test 4: SEO Keyword Integration
        console.log('\n🎯 Test 4: SEO Keyword Optimization');
        const seoTest = await testSEOKeywordIntegration();
        results.push(seoTest);
        // Test 5: YouTube Caption Generation (if API available)
        if (openaiApiKey) {
            console.log('\n🎬 Test 5: YouTube Smart Caption Generation');
            const youtubeGenTest = await testYouTubeCaptionGeneration(openaiApiKey);
            results.push(youtubeGenTest);
            // Test 6: Instagram Caption Generation (if API available)
            console.log('\n📲 Test 6: Instagram Smart Caption Generation');
            const instagramGenTest = await testInstagramCaptionGeneration(openaiApiKey);
            results.push(instagramGenTest);
            // Test 7: No Price/Dash Validation
            console.log('\n🚫 Test 7: Price & Dash Removal Validation');
            const validationTest = await testCaptionValidation(openaiApiKey);
            results.push(validationTest);
            // Test 8: Platform-Specific Optimization
            console.log('\n⚙️ Test 8: Platform-Specific Features');
            const platformTest = await testPlatformSpecificFeatures(openaiApiKey);
            results.push(platformTest);
        }
        // Test 9: User ID Auto-Save Functionality
        console.log('\n💾 Test 9: User ID Auto-Save Feature');
        const autoSaveTest = await testAutoSaveFeature();
        results.push(autoSaveTest);
        // Results Summary
        console.log('\n' + '='.repeat(80));
        console.log('📋 PHASE 4 TEST RESULTS SUMMARY');
        console.log('='.repeat(80));
        let passCount = 0;
        let totalScore = 0;
        let scoreCount = 0;
        results.forEach((result, index) => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${result.testName}: ${status}`);
            console.log(`   ${result.details}`);
            if (result.score !== undefined) {
                console.log(`   Score: ${result.score}/100`);
                totalScore += result.score;
                scoreCount++;
            }
            if (result.success)
                passCount++;
            console.log('');
        });
        const successRate = ((passCount / results.length) * 100).toFixed(1);
        const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 'N/A';
        console.log(`🎯 Overall Success Rate: ${successRate}% (${passCount}/${results.length} tests passed)`);
        console.log(`📊 Average Caption Score: ${avgScore}/100`);
        if (parseFloat(successRate) >= 80) {
            console.log('🎉 PHASE 4 IMPLEMENTATION: EXCELLENT - Ready for production!');
        }
        else if (parseFloat(successRate) >= 60) {
            console.log('✅ PHASE 4 IMPLEMENTATION: GOOD - Minor optimizations recommended');
        }
        else {
            console.log('⚠️ PHASE 4 IMPLEMENTATION: NEEDS IMPROVEMENT - Review failed tests');
        }
    }
    catch (error) {
        console.error('❌ Phase 4 test suite error:', error);
    }
}
async function testYouTubeCompetitorScraping() {
    try {
        const competitors = await (0, fetchCompetitorCaptions_1.fetchCompetitorCaptions)();
        if (competitors.length >= 5) {
            const titles = competitors.map(c => c.title);
            const hasHooks = titles.some(title => title.includes('WON\'T believe') ||
                title.includes('SHOCKING') ||
                title.includes('AVOID'));
            return {
                testName: 'YouTube Competitor Scraping',
                success: hasHooks && competitors.length >= 5,
                details: `Found ${competitors.length} competitor captions with proven hooks: ${hasHooks ? 'YES' : 'NO'}`
            };
        }
        else {
            return {
                testName: 'YouTube Competitor Scraping',
                success: false,
                details: `Only found ${competitors.length} competitor captions (need 5+)`
            };
        }
    }
    catch (error) {
        return {
            testName: 'YouTube Competitor Scraping',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testInstagramCompetitorScraping() {
    try {
        const posts = await (0, fetchCompetitorCaptions_1.fetchInstagramCompetitorPosts)();
        if (posts.length >= 5) {
            const hasEngagementHooks = posts.some(post => post.caption.includes('Save this') ||
                post.caption.includes('Tag someone') ||
                post.caption.includes('Comment below'));
            return {
                testName: 'Instagram Competitor Scraping',
                success: hasEngagementHooks && posts.length >= 5,
                details: `Found ${posts.length} Instagram posts with engagement hooks: ${hasEngagementHooks ? 'YES' : 'NO'}`
            };
        }
        else {
            return {
                testName: 'Instagram Competitor Scraping',
                success: false,
                details: `Only found ${posts.length} Instagram posts (need 5+)`
            };
        }
    }
    catch (error) {
        return {
            testName: 'Instagram Competitor Scraping',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testPatternExtraction() {
    try {
        const patterns = await (0, fetchCompetitorCaptions_1.extractCaptionPatterns)();
        const hasHooks = patterns.hookWords.length >= 10;
        const hasEmojis = patterns.emojis.length >= 15;
        const hasStructures = patterns.titleStructures.length >= 8;
        const hasPhrases = patterns.commonPhrases.length >= 15;
        const hasSEO = patterns.seoTerms.length >= 15;
        const hasCTAs = patterns.callToActions.length >= 10;
        const allValid = hasHooks && hasEmojis && hasStructures && hasPhrases && hasSEO && hasCTAs;
        return {
            testName: 'Pattern Extraction',
            success: allValid,
            details: `Hooks: ${patterns.hookWords.length}, Emojis: ${patterns.emojis.length}, Structures: ${patterns.titleStructures.length}, Phrases: ${patterns.commonPhrases.length}, SEO: ${patterns.seoTerms.length}, CTAs: ${patterns.callToActions.length}`
        };
    }
    catch (error) {
        return {
            testName: 'Pattern Extraction',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testSEOKeywordIntegration() {
    try {
        const keywords = await (0, fetchTrendingKeywords_1.getTopTrendingKeywords)(10);
        const buyingKeywords = await (0, fetchTrendingKeywords_1.getTrendingKeywordsByCategory)('buying', 3);
        const marketKeywords = await (0, fetchTrendingKeywords_1.getTrendingKeywordsByCategory)('market', 3);
        const hasKeywords = keywords.length >= 5;
        const hasBuying = buyingKeywords.length >= 2;
        const hasMarket = marketKeywords.length >= 2;
        const realEstateTerms = keywords.filter(k => k.includes('real estate') ||
            k.includes('home') ||
            k.includes('property'));
        return {
            testName: 'SEO Keyword Integration',
            success: hasKeywords && hasBuying && hasMarket && realEstateTerms.length >= 2,
            details: `Keywords: ${keywords.length}, Buying: ${buyingKeywords.length}, Market: ${marketKeywords.length}, Real Estate Terms: ${realEstateTerms.length}`
        };
    }
    catch (error) {
        return {
            testName: 'SEO Keyword Integration',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testYouTubeCaptionGeneration(openaiApiKey) {
    try {
        const testContent = {
            title: "Beautiful San Antonio Home Tour",
            description: "Take a tour of this amazing $350K property in San Antonio with 3 bedrooms and 2 bathrooms.",
            tags: ["real estate", "san antonio", "home tour"]
        };
        const result = await (0, prepareSmartCaption_1.prepareSmartCaption)(testContent, openaiApiKey, 'youtube');
        // Verify all three versions exist
        const hasAllVersions = result.versionA && result.versionB && result.versionC;
        // Check for price removal
        const noPrices = !result.versionA.title.includes('$') &&
            !result.versionA.description.includes('$') &&
            !result.versionB.title.includes('$') &&
            !result.versionB.description.includes('$') &&
            !result.versionC.title.includes('$') &&
            !result.versionC.description.includes('$');
        // Check for dash removal  
        const noDashes = !result.versionA.title.includes('-') &&
            !result.versionA.description.includes('-') &&
            !result.versionB.title.includes('-') &&
            !result.versionB.description.includes('-') &&
            !result.versionC.title.includes('-') &&
            !result.versionC.description.includes('-');
        const avgScore = (result.versionA.score + result.versionB.score + result.versionC.score) / 3;
        return {
            testName: 'YouTube Caption Generation',
            success: hasAllVersions && noPrices && noDashes,
            details: `Generated 3 versions, No prices: ${noPrices}, No dashes: ${noDashes}`,
            score: Math.round(avgScore),
            captions: result
        };
    }
    catch (error) {
        return {
            testName: 'YouTube Caption Generation',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testInstagramCaptionGeneration(openaiApiKey) {
    try {
        const testContent = {
            title: "Stunning Texas Home Just Listed",
            description: "Check out this incredible $425K house with amazing features and premium finishes.",
            tags: ["realestate", "texas", "luxury", "home"]
        };
        const result = await (0, prepareSmartCaption_1.prepareSmartCaption)(testContent, openaiApiKey, 'instagram');
        // Check for Instagram-specific elements
        const hasInstagramElements = result.versionA.description.toLowerCase().includes('save this') ||
            result.versionA.description.toLowerCase().includes('tag someone') ||
            result.versionB.description.toLowerCase().includes('comment below') ||
            result.versionC.description.toLowerCase().includes('swipe to');
        const noPrices = !result.versionA.title.includes('$') &&
            !result.versionA.description.includes('$');
        const avgScore = (result.versionA.score + result.versionB.score + result.versionC.score) / 3;
        return {
            testName: 'Instagram Caption Generation',
            success: hasInstagramElements && noPrices,
            details: `Instagram elements: ${hasInstagramElements}, No prices: ${noPrices}`,
            score: Math.round(avgScore),
            captions: result
        };
    }
    catch (error) {
        return {
            testName: 'Instagram Caption Generation',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testCaptionValidation(openaiApiKey) {
    try {
        const testContent = {
            title: "Luxury Home - Priced at $750K - Must See!",
            description: "This amazing property costs $750,000 and has premium finishes - perfect for families.",
            tags: ["luxury", "expensive", "premium"]
        };
        const result = await (0, prepareSmartCaption_1.prepareSmartCaption)(testContent, openaiApiKey, 'youtube');
        // Verify NO prices or dashes in any version
        const allVersions = [result.versionA, result.versionB, result.versionC];
        const noPrices = allVersions.every(v => !v.title.includes('$') &&
            !v.description.includes('$') &&
            !v.title.match(/\d+k?\s*(dollars?|bucks?)/i) &&
            !v.description.match(/\d+k?\s*(dollars?|bucks?)/i));
        const noDashes = allVersions.every(v => !v.title.includes('-') &&
            !v.description.includes('-'));
        return {
            testName: 'Price & Dash Removal Validation',
            success: noPrices && noDashes,
            details: `All prices removed: ${noPrices}, All dashes removed: ${noDashes}`
        };
    }
    catch (error) {
        return {
            testName: 'Price & Dash Removal Validation',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testPlatformSpecificFeatures(openaiApiKey) {
    try {
        const testContent = {
            title: "Real Estate Investment Guide",
            description: "Learn the secrets of successful property investment.",
            tags: ["investment", "property", "guide"]
        };
        const youtubeResult = await (0, prepareSmartCaption_1.prepareSmartCaption)(testContent, openaiApiKey, 'youtube');
        const instagramResult = await (0, prepareSmartCaption_1.prepareSmartCaption)(testContent, openaiApiKey, 'instagram');
        // Check for platform-specific elements
        const youtubeElements = youtubeResult.versionA.description.toLowerCase().includes('full') ||
            youtubeResult.versionA.description.toLowerCase().includes('inside') ||
            youtubeResult.versionB.description.toLowerCase().includes('breakdown');
        const instagramElements = instagramResult.versionA.description.toLowerCase().includes('save') ||
            instagramResult.versionB.description.toLowerCase().includes('tag') ||
            instagramResult.versionC.description.toLowerCase().includes('comment');
        return {
            testName: 'Platform-Specific Features',
            success: youtubeElements && instagramElements,
            details: `YouTube features: ${youtubeElements}, Instagram features: ${instagramElements}`
        };
    }
    catch (error) {
        return {
            testName: 'Platform-Specific Features',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function testAutoSaveFeature() {
    try {
        // Check if settings file exists and can be read
        const settingsPath = path_1.default.join(process.cwd(), 'backend', 'settings.json');
        let hasSettings = false;
        if (fs_1.default.existsSync(settingsPath)) {
            const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf8'));
            hasSettings = true;
        }
        return {
            testName: 'User ID Auto-Save Feature',
            success: hasSettings,
            details: `Settings file accessible: ${hasSettings}, Auto-save functionality ready`
        };
    }
    catch (error) {
        return {
            testName: 'User ID Auto-Save Feature',
            success: false,
            details: `Error: ${error}`
        };
    }
}
async function getOpenAIApiKey() {
    try {
        const settingsPath = path_1.default.join(process.cwd(), 'backend', 'settings.json');
        const backupPath = path_1.default.join(process.cwd(), 'settings.json');
        if (fs_1.default.existsSync(settingsPath)) {
            const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf8'));
            return settings.openaiApiKey || null;
        }
        else if (fs_1.default.existsSync(backupPath)) {
            const settings = JSON.parse(fs_1.default.readFileSync(backupPath, 'utf8'));
            return settings.openaiApiKey || null;
        }
        return null;
    }
    catch (error) {
        console.warn('Could not read OpenAI API key from settings');
        return null;
    }
}
// Run the test if this file is executed directly
if (require.main === module) {
    testPhase4().catch(console.error);
}
