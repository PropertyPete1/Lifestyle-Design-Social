import 'dotenv/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  corsOrigins: string[];
}

class EnvironmentConfig {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      port: parseInt(process.env.PORT || '3002'),
      nodeEnv: process.env.NODE_ENV || 'development',
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lifestyle-design-auto-poster-v2',
      corsOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://localhost:3006',
        'https://lifestyle-design-auto-poster.vercel.app'
      ]
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public get(key: keyof AppConfig): any {
    return this.config[key];
  }
}

// Export singleton instance
export const appConfig = new EnvironmentConfig();
export default appConfig;