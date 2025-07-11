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
    private captionModel;
    private hashtagModel;
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
}
export default CaptionGenerationService;
//# sourceMappingURL=captionGenerationService.d.ts.map