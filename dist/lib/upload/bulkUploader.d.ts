export declare function registerUploadedVideos(fileList: {
    url: string;
    type: "user" | "cartoon";
}[]): Promise<import("mongodb").InsertManyResult<import("bson").Document>>;
//# sourceMappingURL=bulkUploader.d.ts.map