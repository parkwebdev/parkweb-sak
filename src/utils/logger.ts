/**
 * Centralized logging utility for development and debugging
 * Can be easily disabled for production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },

  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error || '');
    }
  },

  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  },

  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, data || '');
    }
  },

  success: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data || '');
    }
  }
};

// Helper for performance timing
export const performanceTimer = (label: string) => {
  if (!isDevelopment) return { end: () => {} };
  
  const start = performance.now();
  
  return {
    end: () => {
      const end = performance.now();
      logger.debug(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    }
  };
};