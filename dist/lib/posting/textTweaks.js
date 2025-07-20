"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slightlyRewrite = slightlyRewrite;
exports.tweakText = tweakText;
exports.fallbackEnhance = fallbackEnhance;
exports.prepareCaption = prepareCaption;
function slightlyRewrite(text) {
    const replacements = {
        "home": "place",
        "🔥": "💥",
        "this kitchen": "this layout",
        "dream": "goal",
        "perfect": "ideal",
        "amazing": "beautiful",
        "must-see": "can't-miss",
    };
    let rewritten = text;
    for (const [original, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(original, "gi");
        rewritten = rewritten.replace(regex, replacement);
    }
    const parts = rewritten.split(". ");
    if (parts.length > 1) {
        const first = parts.pop();
        if (first)
            parts.unshift(first);
        rewritten = parts.join(". ");
    }
    return rewritten.trim();
}
function tweakText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/([.!?])(?=\S)/g, '$1 ')
        .replace(/#+(\w+)/g, '#$1')
        .trim();
}
function fallbackEnhance(caption) {
    const emojis = ['✨', '🔥', '🏡', '💡', '📍', '💬'];
    const ending = ['Ready to move in?', 'DM me for more info!', 'Tag someone who needs this!', 'Which room is your favorite?'];
    const randEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const randEnd = ending[Math.floor(Math.random() * ending.length)];
    return `${randEmoji} ${caption} — ${randEnd}`;
}
function prepareCaption(caption, hashtags) {
    const cleanCaption = caption.length > 2200 ? caption.slice(0, 2190) : caption;
    const tagBlock = hashtags.map((tag) => `#${tag}`).join(' ');
    return `${fallbackEnhance(cleanCaption)}\n\n${tagBlock}`;
}
//# sourceMappingURL=textTweaks.js.map