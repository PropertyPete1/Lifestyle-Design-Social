export declare function logDailyPerformance(postId: string, views: number, likes: number, comments: number): Promise<import("mongodb").InsertOneResult<import("bson").Document>>;
export declare function logPostAnalytics(videoId: string, caption: string, views: number): Promise<void>;
//# sourceMappingURL=postLogger.d.ts.map