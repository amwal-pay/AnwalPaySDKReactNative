/**
 * Logger utility for AmwalPay SDK
 * Provides structured logging with different levels and optional debug mode
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private isDebugEnabled: boolean = __DEV__;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogEntries: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Enable or disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    this.isDebugEnabled = enabled;
  }

  /**
   * Set minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug message
   */
  debug(tag: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  /**
   * Log info message
   */
  info(tag: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, tag, message, data);
  }

  /**
   * Log warning message
   */
  warn(tag: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, tag, message, data);
  }

  /**
   * Log error message
   */
  error(tag: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, tag, message, data);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, tag: string, message: string, data?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      tag,
      message,
      data,
    };

    // Store log entry
    this.logs.push(logEntry);

    // Maintain max log entries
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }

    // Console output
    if (this.isDebugEnabled || level >= LogLevel.WARN) {
      const levelStr = LogLevel[level];
      const prefix = `[AmwalPay][${levelStr}][${tag}]`;

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, data || '');
          break;
        case LogLevel.INFO:
          console.info(prefix, message, data || '');
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data || '');
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, data || '');
          break;
      }
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by tag
   */
  getLogsByTag(tag: string): LogEntry[] {
    return this.logs.filter((log) => log.tag === tag);
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export default Logger;
