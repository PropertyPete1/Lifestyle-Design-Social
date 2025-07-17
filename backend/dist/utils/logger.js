"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.logger = void 0;
class Logger {
    constructor(config) {
        this.config = config;
    }
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
        return levels[level] >= levels[this.config.level];
    }
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const context = this.config.context ? `[${this.config.context}]` : '';
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';
        return `${timestamp} ${level.toUpperCase()} ${context} ${message}${dataStr}`;
    }
    log(level, message, data) {
        if (!this.shouldLog(level))
            return;
        if (this.config.enableConsole) {
            const formattedMessage = this.formatMessage(level, message, data);
            console.log(formattedMessage);
        }
    }
    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
}
exports.logger = new Logger({
    level: 'info',
    enableConsole: true,
    context: 'Backend',
    colors: true,
});
const createLogger = (config) => new Logger(config);
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map