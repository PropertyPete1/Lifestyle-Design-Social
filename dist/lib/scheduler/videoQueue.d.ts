export type ScheduledVideo = {
    id: string;
    caption: string;
    fileUrl: string;
    scheduledDate: string;
};
export declare function addToQueue(url: string, type: "user" | "cartoon"): Promise<import("mongodb").InsertOneResult<import("bson").Document>>;
export declare function getNextUnposted(type: "user" | "cartoon"): Promise<import("mongodb").WithId<import("bson").Document> | null>;
export declare function markPosted(videoId: string): Promise<import("mongodb").UpdateResult<import("bson").Document>>;
export declare function getTodayScheduledVideos(): Promise<ScheduledVideo[]>;
//# sourceMappingURL=videoQueue.d.ts.map