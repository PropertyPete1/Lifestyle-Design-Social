export declare function getPastInstagramCaptions(): Promise<string[]>;
export declare function saveInstagramCaption(text: string): Promise<import("mongodb").InsertOneResult<import("bson").Document>>;
export declare function storeCaption(caption: string, engagement: number, hashtags: string[]): Promise<import("mongodb").InsertOneResult<import("bson").Document>>;
export declare function saveCaptionPerformance(captionText: string, score: number): Promise<void>;
export declare function fetchTopCaptionsFromDB(): Promise<string[]>;
//# sourceMappingURL=captionStorage.d.ts.map