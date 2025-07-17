// Standardized logging utility for all projects
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
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

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

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const context = this.config.context ? `[${this.config.context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${context} ${message}${dataStr}`;
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'debug':
        return 'log';
      case 'info':
        return 'info';
      case 'warn':
        return 'warn';
      case 'error':
        return 'error';
      default:
        return 'log';
    }
  }

  private getColorStyle(level: LogLevel): string {
    if (!this.config.colors) return '';
    
    const colors: Record<LogLevel, string> = {
      debug: 'color: #6B7280; font-style: italic;',
      info: 'color: #3B82F6; font-weight: bold;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };
    return colors[level] || '';
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      data,
      context: this.config.context,
    };

    // Add to internal log storage
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging
    if (this.config.enableConsole) {
      const formattedMessage = this.formatMessage(level, message, data);
      const consoleMethod = this.getConsoleMethod(level);
      
      if (typeof window !== 'undefined' && this.config.colors) {
        // Browser environment with colors
        const style = this.getColorStyle(level);
        console[consoleMethod](`%c${formattedMessage}`, style);
      } else {
        // Node.js environment or no colors
        console[consoleMethod](formattedMessage);
      }
    }

    // File logging would be implemented here for Node.js environments
    // if (this.config.enableFile && typeof window === 'undefined') {
    //   // File logging implementation
    // }
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

  // Get recent logs
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Update configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      config: this.config,
      logs: this.logs,
    }, null, 2);
  }
}

// Create default logger instance
const getDefaultLogLevel = (): LogLevel => {
  if (typeof process !== 'undefined' && process.env) {
    return (process.env.LOG_LEVEL as LogLevel) || 'info';
  }
  return 'info';
};

const getDefaultContext = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.LOG_CONTEXT || 'App';
  }
  return 'App';
};

export const logger = new Logger({
  level: getDefaultLogLevel(),
  enableConsole: true,
  enableFile: false,
  context: getDefaultContext(),
  colors: typeof window !== 'undefined' || process.env.NODE_ENV === 'development',
});

// Create logger factory
export const createLogger = (config: LoggerConfig): Logger => {
  return new Logger(config);
};

// Export Logger class for custom implementations
export { Logger }; 