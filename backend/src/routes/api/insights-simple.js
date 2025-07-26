"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * GET /api/insights-simple/test
 * Simple test endpoint
 */
router.get('/test', async (req, res) => {
    res.json({
        success: true,
        message: 'Insights route is working!',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
