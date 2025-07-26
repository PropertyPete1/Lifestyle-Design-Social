"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/hello', (req, res) => {
    res.json({ message: 'Hello from test route!', timestamp: new Date() });
});
exports.default = router;
