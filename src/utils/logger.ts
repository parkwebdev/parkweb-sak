/**
 * Centralized logging utility for development and debugging
 * Automatically disabled in production builds via Vite's esbuild config
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data ?? '');
    }
  },

  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error ?? '');
    }
  },

  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data ?? '');
    }
  },

  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, data ?? '');
    }
  },

  success: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data ?? '');
    }
  }
};
