interface VideoItem {
    title: string;
    url: string;
    type: 'user' | 'cartoon';
}
export declare function getNextInQueue(): "user" | "cartoon";
export declare function resetQueue(): void;
export declare function enqueueVideo(video: VideoItem): Promise<VideoItem>;
export declare function getQueue(): VideoItem[];
export {};
//# sourceMappingURL=queueManager.d.ts.map