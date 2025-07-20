export declare function getUnpostedUserVideos(): Promise<import("mongodb").WithId<import("bson").Document>[]>;
export declare function getCartoonVideos(): Promise<import("mongodb").WithId<import("bson").Document>[]>;
export declare function markVideoAsPosted(id: string): Promise<import("mongodb").UpdateResult<import("bson").Document>>;
//# sourceMappingURL=videoStorage.d.ts.map