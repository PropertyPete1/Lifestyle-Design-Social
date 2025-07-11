import { Pool } from 'pg';
export interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    instagramUsername?: string;
    instagramAccessToken?: string;
    instagramRefreshToken?: string;
    instagramUserId?: string;
    autoPostingEnabled: boolean;
    postingTimes: string[];
    pinnedHours?: string[];
    excludedHours?: string[];
    timezone: string;
    testMode: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
export interface UserCreateInput {
    email: string;
    name: string;
    password: string;
    timezone?: string;
}
export interface UserUpdateInput {
    name?: string;
    instagramUsername?: string;
    instagramAccessToken?: string;
    instagramRefreshToken?: string;
    instagramUserId?: string;
    autoPostingEnabled?: boolean;
    postingTimes?: string[];
    pinnedHours?: string[];
    excludedHours?: string[];
    timezone?: string;
    testMode?: boolean;
}
export declare class UserModel {
    private pool;
    constructor(pool: Pool);
    create(input: UserCreateInput): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, input: UserUpdateInput): Promise<User | null>;
    updateInstagramCredentials(id: string, credentials: {
        instagramUsername?: string;
        instagramAccessToken?: string;
        instagramRefreshToken?: string;
        instagramUserId?: string;
    }): Promise<User | null>;
    updatePostingSettings(id: string, settings: {
        autoPostingEnabled?: boolean;
        postingTimes?: string[];
        pinnedHours?: string[];
        excludedHours?: string[];
        timezone?: string;
        testMode?: boolean;
    }): Promise<User | null>;
    updateLastLogin(id: string): Promise<void>;
    private mapRowToUser;
    private camelToSnake;
}
//# sourceMappingURL=User.d.ts.map