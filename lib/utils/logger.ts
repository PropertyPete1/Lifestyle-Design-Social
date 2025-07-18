export class Logger {
  private prefix: string;

  constructor(options?: { prefix?: string }) {
    this.prefix = options?.prefix || "App";
  }

  info(message: string) {
    console.info(`[${this.prefix}] ℹ️ ${message}`);
  }

  warn(message: string) {
    console.warn(`[${this.prefix}] ⚠️ ${message}`);
  }

  error(message: string) {
    console.error(`[${this.prefix}] ❌ ${message}`);
  }
}

export const logger = new Logger({ prefix: "LD Social" }); 