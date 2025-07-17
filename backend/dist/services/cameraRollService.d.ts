export declare class CameraRollService {
    scanCameraRoll(userId: string): Promise<any[]>;
    aiSelectBestVideos(videos: any[], count: number): Promise<any[]>;
    getCameraRollStats(userId: string): Promise<{
        totalVideos: number;
        totalSize: number;
        avgScore: number;
    }>;
}
export default CameraRollService;
//# sourceMappingURL=cameraRollService.d.ts.map