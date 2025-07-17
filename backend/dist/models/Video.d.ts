import mongoose, { Document } from 'mongoose';
export interface IVideo extends Document {
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
    starred: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Video: mongoose.Model<IVideo, {}, {}, {}, mongoose.Document<unknown, {}, IVideo, {}> & IVideo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export declare const VideoModel: mongoose.Model<IVideo, {}, {}, {}, mongoose.Document<unknown, {}, IVideo, {}> & IVideo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
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
    category?: 'real-estate' | 'cartoon';
    propertyType?: string;
    location?: string;
    price?: number;
    tags?: string[];
    aiScore?: number;
    isActive?: boolean;
    preferredCaption?: string;
    preferredHashtags?: string[];
    preferredMusic?: string;
    coolOffDays?: number;
    starred?: boolean;
}
//# sourceMappingURL=Video.d.ts.map