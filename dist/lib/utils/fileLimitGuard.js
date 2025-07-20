"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUploadLimit = validateUploadLimit;
function validateUploadLimit(files) {
    return files.length <= 30;
}
//# sourceMappingURL=fileLimitGuard.js.map