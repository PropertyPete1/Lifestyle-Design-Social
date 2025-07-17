export interface CartoonResult {
    script: {
        title: string;
        scenes: string[];
        duration: number;
    };
    video: {
        duration: number;
        path: string;
        size: number;
        resolution: string;
    };
    caption: string;
    hashtags: string[];
    createdAt: Date;
}
export interface CartoonStats {
    totalCartoons: number;
    totalDuration: number;
    recentCartoons: Array<{
        title: string;
        createdAt: Date;
        duration: number;
    }>;
}
export declare class CartoonService {
    private cartoonPath;
    constructor();
    createCompleteCartoon(userId: string): Promise<CartoonResult>;
    private checkAIConfiguration;
    private generateAICartoon;
    private generateDemoCartoon;
    private createCartoonFiles;
    private generateAIScript;
    private generateSceneImages;
    private generateVideoFromScenes;
    private generateAIContent;
    getCartoonStats(): CartoonStats;
    listCartoons(): Promise<string[]>;
    deleteCartoon(filename: string): Promise<boolean>;
    private ensureCartoonDirectory;
    private _createDemoCartoonFiles;
}
export default CartoonService;
//# sourceMappingURL=cartoonService.d.ts.map