"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldPostNow = shouldPostNow;
exports.getNextPostType = getNextPostType;
const dayjs_1 = __importDefault(require("dayjs"));
let lastPostHour = 0;
let postIndex = 0;
function shouldPostNow() {
    const now = (0, dayjs_1.default)();
    const hour = now.hour();
    const validHours = [9, 13, 18];
    if (!validHours.includes(hour) || hour === lastPostHour)
        return false;
    lastPostHour = hour;
    return true;
}
async function getNextPostType() {
    const result = postIndex % 2 === 0 ? "user" : "cartoon";
    postIndex = (postIndex + 1) % 3;
    return result;
}
//# sourceMappingURL=utils.js.map