/**
 * Logger - Centralized logging service
 * 
 * Production-ready logging with:
 * - Log levels
 * - Error tracking
 * - Crash reporting integration
 * - Performance monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = __DEV__;

  private constructor() {
    // Initialize crash reporting in production
    if (!this.isDevelopment) {
      // TODO: Initialize Sentry or similar
      // Sentry.init({...});
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...data }
      : { error, ...data };
    
    this.log('error', message, errorData);

    // Report to crash reporting service in production
    if (!this.isDevelopment && error instanceof Error) {
      // TODO: Report to Sentry
      // Sentry.captureException(error, { extra: data });
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // Add stack trace for errors
    if (level === 'error' && data && typeof data === 'object' && 'stack' in data) {
      entry.stack = data.stack as string;
    }

    // Store log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    if (this.isDevelopment || level === 'error') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs;
    
    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log performance metric
   */
  performance(operation: string, duration: number, metadata?: unknown): void {
    this.info(`[PERF] ${operation} took ${duration}ms`, metadata);
    
    // Report slow operations
    if (duration > 1000) {
      this.warn(`[PERF] Slow operation: ${operation}`, { duration, metadata });
    }
  }
}

export default Logger.getInstance();

