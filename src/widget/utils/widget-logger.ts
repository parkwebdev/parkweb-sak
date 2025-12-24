/**
 * Widget Logger Utility
 * 
 * Production-safe logging for the widget that runs on customer websites.
 * 
 * BEHAVIOR:
 * - In preview mode (when testing in Lovable): Logs are enabled
 * - On production customer sites: Logs are completely suppressed
 * 
 * This prevents debug information from polluting customer browser consoles
 * while still allowing developers to debug during development.
 * 
 * @module widget/utils/widget-logger
 * 
 * @example
 * ```ts
 * import { widgetLogger, configureWidgetLogger } from './utils/widget-logger';
 * 
 * // Configure once when widget initializes
 * configureWidgetLogger({ previewMode: config.previewMode });
 * 
 * // Use throughout widget code
 * widgetLogger.info('[Widget] Subscribing to messages');
 * widgetLogger.error('[Widget] Failed to send message', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface WidgetLoggerConfig {
  /** Whether widget is in preview/development mode */
  previewMode?: boolean;
}

/** Internal configuration state */
let config: WidgetLoggerConfig = {
  previewMode: false,
};

/**
 * Configure the widget logger.
 * Should be called once when the widget initializes with config from parent.
 * 
 * @param newConfig - Configuration options
 * @param newConfig.previewMode - Set to true to enable logging (preview/dev mode)
 */
export const configureWidgetLogger = (newConfig: WidgetLoggerConfig): void => {
  config = { ...config, ...newConfig };
};

/**
 * Determine if logging should occur.
 * Only logs in preview mode to keep customer consoles clean.
 */
const shouldLog = (): boolean => {
  return config.previewMode === true;
};

/**
 * Format and output a log message if logging is enabled.
 * 
 * @param level - Log level (debug, info, warn, error)
 * @param message - Primary message string
 * @param args - Additional arguments to log
 */
const formatMessage = (level: LogLevel, message: string, ...args: unknown[]): void => {
  if (!shouldLog()) return;
  
  const prefix = `[Widget:${level.toUpperCase()}]`;
  
  switch (level) {
    case 'debug':
      console.debug(prefix, message, ...args);
      break;
    case 'info':
      console.info(prefix, message, ...args);
      break;
    case 'warn':
      console.warn(prefix, message, ...args);
      break;
    case 'error':
      console.error(prefix, message, ...args);
      break;
  }
};

/**
 * Widget logger instance.
 * 
 * Use this instead of console.log/error/warn throughout widget code.
 * Logs are only output when previewMode is enabled.
 * 
 * @example
 * ```ts
 * widgetLogger.debug('Detailed debug info', { data });
 * widgetLogger.info('Something happened');
 * widgetLogger.warn('This might be a problem');
 * widgetLogger.error('Something went wrong', error);
 * ```
 */
export const widgetLogger = {
  /** Debug level - verbose information for development */
  debug: (message: string, ...args: unknown[]): void => formatMessage('debug', message, ...args),
  
  /** Info level - general informational messages */
  info: (message: string, ...args: unknown[]): void => formatMessage('info', message, ...args),
  
  /** Warn level - potential issues that don't break functionality */
  warn: (message: string, ...args: unknown[]): void => formatMessage('warn', message, ...args),
  
  /** Error level - errors and failures */
  error: (message: string, ...args: unknown[]): void => formatMessage('error', message, ...args),
};

export default widgetLogger;
