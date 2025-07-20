"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextInQueue = getNextInQueue;
exports.resetQueue = resetQueue;
exports.enqueueVideo = enqueueVideo;
exports.getQueue = getQueue;
let pointer = 0;
let queue = [];
function getNextInQueue() {
    const value = pointer % 2 === 0 ? "user" : "cartoon";
    pointer++;
    return value;
}
function resetQueue() {
    pointer = 0;
}
async function enqueueVideo(video) {
    queue.push(video);
    return video;
}
function getQueue() {
    return queue;
}
//# sourceMappingURL=queueManager.js.map