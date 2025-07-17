export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
    context?: string;
}
export interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile?: boolean;
    context?: string;
    colors?: boolean;
}
declare class Logger {
    private config;
    constructor(config: LoggerConfig);
    private shouldLog;
    private formatMessage;
    private log;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
}
export declare const logger: Logger;
export declare const createLogger: (config: LoggerConfig) => Logger;
export {};
//# sourceMappingURL=logger.d.ts.map