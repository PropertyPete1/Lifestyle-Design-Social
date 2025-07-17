export interface CaptionGenerationOptions {
    videoId: string;
    tone?: 'professional' | 'casual' | 'funny' | 'luxury';
    includeHashtags?: boolean;
    maxLength?: number;
    includeEmojis?: boolean;
    targetAudience?: string;
    callToAction?: string;
}
export interface GeneratedCaption {
    caption: string;
    hashtags: string[];
    emojis: string[];
    length: number;
    tone: string;
    callToAction?: string;
}
export interface CaptionTemplate {
    id: string;
    template: string;
    tone: string;
    category: string;
    hashtags: string[];
    emojis: string[];
    callToAction: string;
}
export declare class CaptionGenerationService {
    private videoModel;
    constructor();
    generateCaption(options: CaptionGenerationOptions): Promise<GeneratedCaption>;
    private getCaptionTemplate;
    private getDefaultTemplate;
    private fillCaptionTemplate;
    private generateHashtags;
    private getDefaultHashtags;
    private getEmojisForCategory;
    private getRandomFunnyScenario;
    private getRandomScenario;
    private getRandomLesson;
    getCaptionStats(): Promise<{
        totalGenerated: number;
        averageLength: number;
        mostUsedTone: string;
        mostUsedHashtags: string[];
    }>;
    saveCustomTemplate(template: Omit<CaptionTemplate, 'id'>): Promise<string>;
    generateTrendingHashtags(keywords: string[], maxCount?: number): Promise<string[]>;
    private generateHashtagsFromKeywords;
    private getDefaultHashtagsByCount;
    generateCaptionAndHashtags(_userId: string, videoId: string, _platform: string, options?: Partial<CaptionGenerationOptions>): Promise<GeneratedCaption>;
}
export declare const captionGenerationService: CaptionGenerationService;
export default CaptionGenerationService;
//# sourceMappingURL=captionGenerationService.d.ts.map