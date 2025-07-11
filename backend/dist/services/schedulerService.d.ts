export interface ScheduleConfig {
    userId: string;
    enabled: boolean;
    times: string[];
    days: number[];
    postsPerDay: number;
    categoryRotation: string[];
    timezone: string;
    testMode: boolean;
}
export interface ScheduleResult {
    success: boolean;
    scheduledPosts: number;
    errors: string[];
    nextExecution: Date;
}
export interface TimingOptimization {
    bestTimes: string[];
    bestDays: number[];
    recommendedFrequency: number;
    timezone: string;
}
export declare class SchedulerService {
    private userModel;
    private postModel;
    private autoPostingService;
    private analyticsService;
    constructor();
    schedulePosts(userId: string, days?: number): Promise<ScheduleResult>;
    executeScheduledPosts(): Promise<ScheduleResult>;
    optimizePostingTimes(userId: string): Promise<TimingOptimization>;
    private calculateOptimalFrequency;
    getScheduleStatus(userId: string): Promise<any>;
    pauseScheduling(userId: string): Promise<void>;
    resumeScheduling(userId: string): Promise<void>;
    updateScheduleConfig(userId: string, config: Partial<ScheduleConfig>): Promise<void>;
    private calculateNextExecution;
    private calculateNextExecutionTime;
    getSchedulerStats(): Promise<any>;
    cleanupOldScheduledPosts(daysOld?: number): Promise<number>;
}
export default SchedulerService;
//# sourceMappingURL=schedulerService.d.ts.map