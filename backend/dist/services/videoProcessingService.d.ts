export interface VideoMetadata {
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    fps: number;
    codec: string;
    size: number;
}
export interface ProcessingOptions {
    generateThumbnail?: boolean;
    compressVideo?: boolean;
    extractMetadata?: boolean;
    maxDuration?: number;
    maxFileSize?: number;
}
export declare class VideoProcessingService {
    private videoModel;
    constructor();
    processVideo(filePath: string, userId: string, options?: ProcessingOptions): Promise<{
        metadata: VideoMetadata;
        thumbnailPath?: string;
        processedFilePath?: string;
    }>;
    private extractMetadata;
    private validateVideo;
    private generateThumbnail;
    private compressVideo;
    getInstagramVideoSettings(): {
        maxDuration: number;
        maxFileSize: number;
        recommendedDimensions: {
            width: number;
            height: number;
        };
        recommendedBitrate: number;
    };
    updateVideoMetadata(videoId: string, metadata: VideoMetadata, thumbnailPath?: string): Promise<void>;
    cleanupTempFiles(filePaths: string[]): Promise<void>;
    getProcessingStats(): Promise<{
        totalProcessed: number;
        averageProcessingTime: number;
        successRate: number;
        totalSize: number;
    }>;
}
export default VideoProcessingService;
//# sourceMappingURL=videoProcessingService.d.ts.map