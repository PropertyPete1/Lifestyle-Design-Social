"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayMidnight = getTodayMidnight;
exports.getNextPostingSlot = getNextPostingSlot;
function getTodayMidnight() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
function getNextPostingSlot() {
    const now = new Date();
    now.setHours(now.getHours() + 4);
    return now;
}
//# sourceMappingURL=dateHelpers.js.map