import { Pool } from 'pg';
export interface Video {
    id: string;
    userId: string;
    title: string;
    description?: string;
    filename: string;
    filePath: string;
    fileSize: number;
    duration?: number;
    resolution?: string;
    thumbnailPath?: string;
    hasAudio: boolean;
    category: 'real-estate' | 'cartoon';
    propertyType?: string;
    location?: string;
    price?: number;
    tags: string[];
    aiScore?: number;
    postCount: number;
    lastPostedAt?: Date;
    nextPostDate?: Date;
    isActive: boolean;
    preferredCaption?: string;
    preferredHashtags?: string[];
    preferredMusic?: string;
    coolOffDays: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface VideoCreateInput {
    userId: string;
    title: string;
    description?: string;
    filename: string;
    filePath: string;
    fileSize: number;
    duration?: number;
    resolution?: string;
    hasAudio?: boolean;
    category: 'real-estate' | 'cartoon';
    propertyType?: string;
    location?: string;
    price?: number;
    tags?: string[];
    preferredCaption?: string;
    preferredHashtags?: string[];
    preferredMusic?: string;
    coolOffDays?: number;
}
export interface VideoUpdateInput {
    title?: string;
    description?: string;
    thumbnailPath?: string;
    aiScore?: number;
    isActive?: boolean;
    preferredCaption?: string;
    preferredHashtags?: string[];
    preferredMusic?: string;
    coolOffDays?: number;
}
export declare class VideoModel {
    private pool;
    constructor(pool: Pool);
    create(input: VideoCreateInput): Promise<Video>;
    findById(id: string): Promise<Video | null>;
    findByUser(userId: string, options?: {
        category?: 'real-estate' | 'cartoon';
        isActive?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Video[]>;
    getNextVideoForPosting(userId: string, category: 'real-estate' | 'cartoon'): Promise<Video | null>;
    markAsPosted(id: string): Promise<Video | null>;
    update(id: string, input: VideoUpdateInput): Promise<Video | null>;
    updateAiScore(id: string, aiScore: number): Promise<Video | null>;
    updateThumbnail(id: string, thumbnailPath: string): Promise<Video | null>;
    deactivate(id: string): Promise<Video | null>;
    delete(id: string): Promise<boolean>;
    getVideoStats(userId: string): Promise<{
        totalVideos: number;
        totalPosts: number;
        avgPostsPerVideo: number;
        unpostedVideos: number;
        readyToRepost: number;
        byCategory: {
            'real-estate': number;
            cartoon: number;
        };
    }>;
    private mapRowToVideo;
    private camelToSnake;
}
//# sourceMappingURL=Video.d.ts.map