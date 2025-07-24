"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToLocal = saveToLocal;
exports.getLocalFilePath = getLocalFilePath;
exports.listLocalFiles = listLocalFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Local file storage service as fallback when Dropbox is unavailable
 */
const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');
// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created uploads directory: ${UPLOAD_DIR}`);
}
async function saveToLocal(buffer, filename) {
    try {
        // Create unique filename with timestamp
        const timestamp = Date.now();
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${timestamp}_${safeFilename}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);
        // Write file to local storage
        await fs.promises.writeFile(filePath, buffer);
        console.log(`✅ Saved to local storage: ${uniqueFilename}`);
        // Return local file path/URL
        return `local://${uniqueFilename}`;
    }
    catch (error) {
        console.error('Local storage error:', error);
        throw new Error(`Failed to save file locally: ${error}`);
    }
}
function getLocalFilePath(filename) {
    return path.join(UPLOAD_DIR, filename);
}
function listLocalFiles() {
    try {
        return fs.readdirSync(UPLOAD_DIR);
    }
    catch (error) {
        console.error('Error listing local files:', error);
        return [];
    }
}
