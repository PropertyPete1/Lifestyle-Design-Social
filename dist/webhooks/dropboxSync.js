"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDropboxWebhook = handleDropboxWebhook;
const syncToQueue_1 = require("../lib/dropbox/syncToQueue");
async function handleDropboxWebhook() {
    try {
        await (0, syncToQueue_1.syncDropboxToQueue)();
        console.log('✅ Dropbox sync to queue completed.');
    }
    catch (err) {
        console.error('❌ Dropbox sync to queue failed:', err);
    }
}
//# sourceMappingURL=dropboxSync.js.map