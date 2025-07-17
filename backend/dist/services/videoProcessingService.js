"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProcessingService = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const Video_1 = require("../models/Video");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
class VideoProcessingService {
    constructor() {
        this.videoModel = Video_1.VideoModel;
    }
    async processVideo(filePath, userId, options = {}) {
        try {
            logger_1.logger.info(`Processing video: ${filePath}`);
            const metadata = await this.extractMetadata(filePath);
            logger_1.logger.info(`Extracted metadata for video: ${metadata.duration}s, ${metadata.width}x${metadata.height}`);
            await this.validateVideo(metadata, options);
            let thumbnailPath;
            let processedFilePath;
            if (options.generateThumbnail) {
                thumbnailPath = await this.generateThumbnail(filePath, metadata);
                logger_1.logger.info(`Generated thumbnail: ${thumbnailPath}`);
            }
            if (options.compressVideo) {
                processedFilePath = await this.compressVideo(filePath, metadata);
                logger_1.logger.info(`Compressed video: ${processedFilePath}`);
            }
            return {
                metadata,
                thumbnailPath,
                processedFilePath: processedFilePath || filePath,
            };
        }
        catch (error) {
            logger_1.logger.error('Video processing failed:', error);
            throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async extractMetadata(filePath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(new Error(`Failed to extract metadata: ${err.message}`));
                    return;
                }
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                if (!videoStream) {
                    reject(new Error('No video stream found'));
                    return;
                }
                const stats = fs_1.default.statSync(filePath);
                resolve({
                    duration: parseFloat(String(metadata.format.duration || '0')),
                    width: videoStream.width || 0,
                    height: videoStream.height || 0,
                    bitrate: parseInt(metadata.format.bit_rate ? String(metadata.format.bit_rate) : '0'),
                    fps: parseFloat(videoStream.r_frame_rate?.split('/')[0] || '0') / parseFloat(videoStream.r_frame_rate?.split('/')[1] || '1'),
                    codec: videoStream.codec_name || 'unknown',
                    size: stats.size,
                });
            });
        });
    }
    async validateVideo(metadata, options) {
        const errors = [];
        if (options.maxDuration && metadata.duration > options.maxDuration) {
            errors.push(`Video duration (${metadata.duration}s) exceeds maximum (${options.maxDuration}s)`);
        }
        if (options.maxFileSize && metadata.size > options.maxFileSize * 1024 * 1024) {
            errors.push(`Video size (${Math.round(metadata.size / 1024 / 1024)}MB) exceeds maximum (${options.maxFileSize}MB)`);
        }
        if (metadata.width < 500 || metadata.height < 500) {
            errors.push('Video dimensions must be at least 500x500 pixels');
        }
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio < 0.8 || aspectRatio > 1.91) {
            logger_1.logger.warn(`Video aspect ratio (${aspectRatio.toFixed(2)}) may not be optimal for Instagram`);
        }
        if (errors.length > 0) {
            throw new Error(`Video validation failed: ${errors.join(', ')}`);
        }
    }
    async generateThumbnail(filePath, metadata) {
        const thumbnailDir = path_1.default.join(path_1.default.dirname(filePath), 'thumbnails');
        if (!fs_1.default.existsSync(thumbnailDir)) {
            fs_1.default.mkdirSync(thumbnailDir, { recursive: true });
        }
        const thumbnailPath = path_1.default.join(thumbnailDir, `${path_1.default.basename(filePath, path_1.default.extname(filePath))}_thumb.jpg`);
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(filePath)
                .screenshots({
                timestamps: ['50%'],
                filename: path_1.default.basename(thumbnailPath),
                folder: path_1.default.dirname(thumbnailPath),
                size: '1080x1080',
            })
                .on('end', () => {
                logger_1.logger.info(`Thumbnail generated: ${thumbnailPath}`);
                resolve(thumbnailPath);
            })
                .on('error', (err) => {
                reject(new Error(`Thumbnail generation failed: ${err.message}`));
            });
        });
    }
    async compressVideo(filePath, metadata) {
        const compressedDir = path_1.default.join(path_1.default.dirname(filePath), 'compressed');
        if (!fs_1.default.existsSync(compressedDir)) {
            fs_1.default.mkdirSync(compressedDir, { recursive: true });
        }
        const compressedPath = path_1.default.join(compressedDir, `${path_1.default.basename(filePath, path_1.default.extname(filePath))}_compressed.mp4`);
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(filePath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .size('1080x1080')
                .videoBitrate('2000k')
                .audioBitrate('128k')
                .fps(30)
                .output(compressedPath)
                .on('end', () => {
                logger_1.logger.info(`Video compressed: ${compressedPath}`);
                resolve(compressedPath);
            })
                .on('error', (err) => {
                reject(new Error(`Video compression failed: ${err.message}`));
            });
        });
    }
    getInstagramVideoSettings() {
        return {
            maxDuration: 60,
            maxFileSize: 100,
            recommendedDimensions: { width: 1080, height: 1080 },
            recommendedBitrate: 2000,
        };
    }
    async updateVideoMetadata(videoId, metadata, thumbnailPath) {
        try {
            await this.videoModel.findByIdAndUpdate(videoId, {
                thumbnailPath,
            });
            logger_1.logger.info(`Updated video metadata for video: ${videoId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to update video metadata:', error);
            throw error;
        }
    }
    async cleanupTempFiles(filePaths) {
        for (const filePath of filePaths) {
            try {
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                    logger_1.logger.info(`Cleaned up temp file: ${filePath}`);
                }
            }
            catch (error) {
                logger_1.logger.warn(`Failed to cleanup temp file ${filePath}:`, error);
            }
        }
    }
    async getProcessingStats() {
        try {
            const result = await this.videoModel.aggregate([
                { $group: { _id: null, count: { $sum: 1 }, totalSize: { $sum: '$fileSize' } } }
            ]);
            return {
                totalProcessed: result[0]?.count || 0,
                averageProcessingTime: 0,
                successRate: 1.0,
                totalSize: 0,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get processing stats:', error);
            throw error;
        }
    }
}
exports.VideoProcessingService = VideoProcessingService;
exports.default = VideoProcessingService;
