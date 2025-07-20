interface CaptionStats {
    text: string;
    likes: number;
    comments: number;
    views: number;
    engagementScore: number;
}
export declare function analyzeTopCaptions(limit?: number): Promise<CaptionStats[]>;
export {};
//# sourceMappingURL=analyzeTopCaptions.d.ts.map