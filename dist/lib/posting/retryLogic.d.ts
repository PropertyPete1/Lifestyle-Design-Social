import { PostResult } from "./instagramPublisher";
export declare function retryPost(video: any, caption: string, maxRetries?: number): Promise<PostResult>;
export declare function tryPostingWithRetries(videoId: string, caption: string, fileUrl: string): Promise<boolean>;
//# sourceMappingURL=retryLogic.d.ts.map