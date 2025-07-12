"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraRollService = void 0;
class CameraRollService {
    async scanCameraRoll(userId) {
        return [
            { name: 'video1.mp4', duration: 60, size: 10485760, width: 1920, height: 1080, aiScore: 0.95, hasAudio: true },
            { name: 'video2.mp4', duration: 45, size: 7340032, width: 1280, height: 720, aiScore: 0.89, hasAudio: true }
        ];
    }
    async aiSelectBestVideos(videos, count) {
        return videos.slice(0, count);
    }
}
exports.CameraRollService = CameraRollService;
exports.default = CameraRollService;
//# sourceMappingURL=cameraRollService.js.map