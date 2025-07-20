"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropboxClient = void 0;
const dropbox_1 = require("dropbox");
exports.dropboxClient = new dropbox_1.Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    fetch,
});
//# sourceMappingURL=client.js.map