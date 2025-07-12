declare class RealEstateAutoPostingApp {
    private app;
    private server;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private setupGracefulShutdown;
    start(): Promise<void>;
}
export declare const app: RealEstateAutoPostingApp;
export {};
//# sourceMappingURL=app.d.ts.map