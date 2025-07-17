export declare const config: {
    port: number;
    nodeEnv: string;
    database: {
        uri: string;
        maxConnections: number;
        connectionTimeout: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
        issuer: string;
        audience: string;
    };
    cors: {
        origins: string[];
    };
    ai: {
        openai: {
            apiKey: string;
            model: string;
            maxTokens: number;
            temperature: number;
        };
    };
    socialPlatforms: {
        instagram: {
            graphApiToken: string;
            graphApiTokenAustin: string;
            clientId: string;
            clientSecret: string;
            redirectUri: string;
        };
        twitter: {
            apiKey: string;
            apiSecret: string;
            accessToken: string;
            accessSecret: string;
            bearerToken: string;
        };
        tiktok: {
            clientId: string;
            clientSecret: string;
            redirectUri: string;
        };
        youtube: {
            clientId: string;
            clientSecret: string;
            redirectUri: string;
        };
    };
    upload: {
        maxFileSize: number;
        uploadPath: string;
        allowedMimeTypes: string[];
    };
    posting: {
        optimalTimes: {
            twitter: string[];
            instagram: string[];
        };
        timezone: string;
    };
    features: {
        enableVideoProcessing: boolean;
        enableAICaptions: boolean;
        enableAnalytics: boolean;
        enableNotifications: boolean;
        enableWebSocket: boolean;
        enableBackgroundJobs: boolean;
        enableRateLimiting: boolean;
        enableAuditLogging: boolean;
    };
    security: {
        bcryptRounds: number;
        passwordMinLength: number;
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map