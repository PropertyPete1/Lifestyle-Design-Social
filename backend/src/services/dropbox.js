"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToDropbox = uploadToDropbox;
const dropbox_1 = require("dropbox");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const settingsPath = path_1.default.resolve(__dirname, '../../../frontend/settings.json');
let dropboxApiKey = process.env.DROPBOX_API_KEY || '';
if (!dropboxApiKey && fs_1.default.existsSync(settingsPath)) {
    try {
        const settings = JSON.parse(fs_1.default.readFileSync(settingsPath, 'utf-8'));
        dropboxApiKey = settings.dropboxApiKey || '';
    }
    catch (e) {
        console.error('Failed to read Dropbox API key from settings.json:', e);
    }
}
if (!dropboxApiKey) {
    throw new Error('Dropbox API key not set in environment or settings.json');
}
const dbx = new dropbox_1.Dropbox({ accessToken: dropboxApiKey });
function uploadToDropbox(buffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const dropboxPath = `/uploads/${Date.now()}_${filename}`;
        const response = yield dbx.filesUpload({
            path: dropboxPath,
            contents: buffer,
            mode: { ".tag": "add" },
            autorename: true,
            mute: false,
        });
        // Create a shared link
        const shared = yield dbx.sharingCreateSharedLinkWithSettings({ path: response.result.path_display });
        // Convert Dropbox shared link to direct download link
        return shared.result.url.replace('?dl=0', '?raw=1');
    });
}
