export declare const config: {
    port: number;
    nodeEnv: string;
    database: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl: boolean;
        maxConnections: number;
        connectionTimeout: number;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        database: number;
        maxRetriesPerRequest: number;
        retryDelayOnFailover: number;
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
            clientId: string;
            clientSecret: string;
            redirectUri: string;
            scopes: string[];
        };
        tiktok: {
            clientId: string;
            clientSecret: string;
            redirectUri: string;
            scopes: string[];
        };
        youtube: {
            clientId: string;
            clientSecret: string;
            redirectUri: string;
            scopes: string[];
        };
    };
    upload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        destination: string;
        enableVirusScan: boolean;
    };
    email: {
        provider: string;
        apiKey: string;
        fromEmail: string;
        replyToEmail: string;
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        s3: {
            bucket: string;
            cloudFrontDomain: string | undefined;
        };
        ses: {
            fromEmail: string;
            replyToEmail: string;
        };
    };
    stripe: {
        publicKey: string;
        secretKey: string;
        webhookSecret: string;
        products: {
            free: string;
            basic: string;
            pro: string;
            enterprise: string;
        };
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