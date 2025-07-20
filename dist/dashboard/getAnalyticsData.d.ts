export declare function getAnalyticsData(): Promise<{
    totalPosts: number;
    successfulPosts: number;
    failedPosts: number;
    viewsOverTime: {
        date: Date;
        views: number;
    }[];
    hashtagStats: Record<string, number>;
}>;
//# sourceMappingURL=getAnalyticsData.d.ts.map