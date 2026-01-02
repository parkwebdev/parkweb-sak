/**
 * Structured Logging
 * Provides JSON-formatted logging with request correlation.
 * 
 * @module _shared/logger
 * @description Creates structured loggers bound to a requestId for 
 * easy correlation in log aggregators.
 * 
 * @example
 * ```typescript
 * import { createLogger } from "../_shared/logger.ts";
 * 
 * const requestId = crypto.randomUUID();
 * const logger = createLogger(requestId);
 * 
 * logger.info('Processing request', { agentId: 'abc123' });
 * logger.error('Failed to process', { error: err.message });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Create a structured logger bound to a specific requestId.
 * All logs are JSON-formatted for easy parsing in log aggregators.
 */
export function createLogger(requestId: string): Logger {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      level,
      message,
      ...(data && { data }),
    };
    const logStr = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(logStr);
        break;
      case 'warn':
        console.warn(logStr);
        break;
      case 'debug':
        console.debug(logStr);
        break;
      default:
        console.log(logStr);
    }
  };

  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  };
}
