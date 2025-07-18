// Backend logger - consolidated implementation (duplicate removed)
// Note: Shared logger exists in packages/shared but import constraints prevent direct usage
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

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.config.level];
  }

  // DUPLICATE of packages/shared/src/utils/logger.ts formatMessage method
  // Import constraints prevent using shared logger directly
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const context = this.config.context ? `[${this.config.context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    // Console output only (simplified to reduce duplication)
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(level, message, data);
      // Production-ready logging without console.log
      if (level === 'error') {
        process.stderr.write(formattedMessage + '\n');
      } else {
        process.stdout.write(formattedMessage + '\n');
      }
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

// Export backend logger instance
export const logger = new Logger({
  level: 'info',
  enableConsole: true,
  context: 'Backend',
  colors: true,
});

// Export logger factory
export const createLogger = (config: LoggerConfig): Logger => new Logger(config);
