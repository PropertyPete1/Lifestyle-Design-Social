"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingHashtags = getTrendingHashtags;
const trending = [
    "#realtorsofinstagram",
    "#househunting",
    "#firsttimehomebuyer",
    "#newlisting",
    "#texashomes",
    "#cartoonhouse",
    "#dreamkitchen",
    "#openhouse",
    "#instarealestate",
    "#homesweethome",
];
async function getTrendingHashtags(limit = 5) {
    const shuffled = trending.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
}
//# sourceMappingURL=getTrendingHashtags.js.map