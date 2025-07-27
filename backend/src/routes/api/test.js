"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testPhase2_1 = require("../../lib/youtube/testPhase2");
const router = (0, express_1.Router)();
/**
 * POST /api/test/phase2
 * Run comprehensive Phase 2 test suite
 */
router.post('/phase2', async (req, res) => {
    try {
        console.log('🚀 Starting Phase 2 test suite via API...');
        const tester = new testPhase2_1.Phase2Tester();
        const result = await tester.runCompleteTest();
        res.json({
            success: result.success,
            message: result.success ? 'Phase 2 test suite completed successfully' : 'Phase 2 test suite failed',
            testResults: result.results,
            summary: result.summary,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Phase 2 test API error:', error);
        res.status(500).json({
            success: false,
            error: 'Phase 2 test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/test/status
 * Get test endpoints status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Test API endpoints ready',
        availableTests: [
            {
                endpoint: 'POST /api/test/phase2',
                description: 'Run comprehensive Phase 2 scraping and smart repost test suite',
                features: [
                    'Platform connectivity testing',
                    'YouTube & Instagram scraping validation',
                    'Smart repost logic verification',
                    'Data integrity checks',
                    'API endpoint documentation'
                ]
            }
        ]
    });
});
exports.default = router;
