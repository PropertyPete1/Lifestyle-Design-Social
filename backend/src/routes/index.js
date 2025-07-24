"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = __importDefault(require("./api/upload"));
const instagram_1 = __importDefault(require("./api/instagram"));
const youtube_1 = __importDefault(require("./api/youtube"));
const settings_1 = __importDefault(require("./api/settings"));
const oauth_1 = __importDefault(require("./youtube/oauth"));
const router = express_1.default.Router();
router.use('/upload', upload_1.default);
router.use('/instagram', instagram_1.default);
router.use('/youtube', youtube_1.default);
router.use('/youtube/oauth', oauth_1.default);
router.use('/settings', settings_1.default);
exports.default = router;
