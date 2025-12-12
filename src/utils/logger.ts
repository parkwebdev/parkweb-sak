/**
 * Centralized Logging Utility
 * 
 * Provides structured logging for development and debugging.
 * All log methods are automatically disabled in production builds
 * via Vite's esbuild configuration.
 * 
 * @module utils/logger
 * 
 * @example
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('User signed in', { userId: user.id });
 * logger.error('Failed to fetch data', error);
 * logger.warn('Deprecated API used');
 * logger.debug('Processing item', { itemId });
 * logger.success('Operation completed');
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Logger object with methods for different log levels.
 * All methods accept a message and optional data.
 */
export const logger = {
  /**
   * Log informational message.
   * @param message - The message to log
   * @param data - Optional additional data to log
   */
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data ?? '');
    }
  },

  /**
   * Log error message.
   * @param message - The error message to log
   * @param error - Optional error object or additional data
   */
  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error ?? '');
    }
  },

  /**
   * Log warning message.
   * @param message - The warning message to log
   * @param data - Optional additional data to log
   */
  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data ?? '');
    }
  },

  /**
   * Log debug message (for development troubleshooting).
   * @param message - The debug message to log
   * @param data - Optional additional data to log
   */
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, data ?? '');
    }
  },

  /**
   * Log success message.
   * @param message - The success message to log
   * @param data - Optional additional data to log
   */
  success: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data ?? '');
    }
  }
};
