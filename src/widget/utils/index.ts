/**
 * Widget Utilities
 * 
 * Pure utility functions for the widget.
 * No React dependencies - can be used anywhere.
 * 
 * @module widget/utils
 */

/**
 * Referrer and UTM tracking utilities
 * @see {@link ./referrer}
 */
export { detectEntryType, parseUtmParams } from './referrer';

/**
 * Text and time formatting utilities
 * @see {@link ./formatting}
 */
export { formatTimestamp, truncateMessage, formatSenderName } from './formatting';

/**
 * Form and data validation utilities
 * @see {@link ./validation}
 */
export { isValidUUID, isValidEmail, isNotEmpty, isValidPhone } from './validation';

/**
 * Session and visitor ID management utilities
 * @see {@link ./session}
 */
export { 
  getSessionId, 
  getOrCreateVisitorId,
  hasTakeoverNoticeBeenShown,
  setTakeoverNoticeShown,
  clearTakeoverNotice
} from './session';

/**
 * Content stripping utilities for link preview and call button display
 * @see {@link ./url-stripper}
 */
export { stripUrlsFromContent, stripPhoneNumbersFromContent } from './url-stripper';
