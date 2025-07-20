"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gptMimicCaption = gptMimicCaption;
const openai_1 = require("openai");
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
async function gptMimicCaption(baseCaption, topCaptions) {
    const messages = [
        {
            role: 'system',
            content: 'You are a social media expert helping improve captions for real estate videos.',
        },
        {
            role: 'user',
            content: `Here are some high-performing captions:\n\n${topCaptions.join('\n')}\n\nHere is a new caption:\n${baseCaption}\n\nMimic the style and improve it slightly.`,
        },
    ];
    const res = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 100,
    });
    return res.choices[0].message?.content?.trim() || baseCaption;
}
//# sourceMappingURL=gptCaptionMimic.js.map