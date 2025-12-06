/**
 * Widget Utilities
 * 
 * Central export for all widget utility functions.
 */

// Referrer and UTM utilities
export { detectEntryType, parseUtmParams } from './referrer';

// Formatting utilities
export { formatTimestamp, truncateMessage, formatSenderName } from './formatting';

// Validation utilities
export { isValidUUID, isValidEmail, isNotEmpty, isValidPhone } from './validation';

// Session utilities
export { 
  getSessionId, 
  getOrCreateVisitorId,
  hasTakeoverNoticeBeenShown,
  setTakeoverNoticeShown,
  clearTakeoverNotice
} from './session';
