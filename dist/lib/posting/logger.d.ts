export declare function logPostSuccess(video: any, caption: string, type: "user" | "cartoon"): Promise<import("mongodb").InsertOneResult<import("bson").Document>>;
export declare function logPostFailure(video: any, error: string): Promise<import("mongodb").InsertOneResult<import("bson").Document>>;
export declare function logCaptionResult(caption: string, hashtags: string[], views: number): Promise<void>;
export declare function logSimplePostSuccess(videoId: string): void;
export declare function logSimplePostFailure(videoId: string, reason: string): void;
//# sourceMappingURL=logger.d.ts.map