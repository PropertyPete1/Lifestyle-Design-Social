"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceHashtags = replaceHashtags;
const getTrendingHashtags_1 = require("./getTrendingHashtags");
async function replaceHashtags(caption) {
    const trending = await (0, getTrendingHashtags_1.getTrendingHashtags)(10);
    const withoutOldTags = caption.replace(/#[\w]+/g, '').trim();
    const newHashtags = trending.map((tag) => `#${tag}`).join(' ');
    return `${withoutOldTags}\n\n${newHashtags}`;
}
//# sourceMappingURL=replaceHashtags.js.map