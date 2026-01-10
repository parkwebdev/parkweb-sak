/**
 * Widget UI Components
 * 
 * Reusable UI components extracted from ChatWidget for modularity.
 * Each component is focused on a single responsibility.
 * 
 * @module widget/components
 */

/** Floating toggle button to open/close widget */
export { FloatingButton } from './FloatingButton';

/** Widget header with gradient background and agent info */
export { WidgetHeader } from './WidgetHeader';

/** Bottom navigation bar with home/chat/help tabs */
export { WidgetNav } from './WidgetNav';

/** Animated typing indicator dots */
export { TypingIndicator } from './TypingIndicator';

/** Individual chat message bubble with reactions */
export { MessageBubble } from './MessageBubble';

/** Chat input area with send/attach/voice buttons */
export { MessageInput } from './MessageInput';

/** Lead capture form for visitor information */
export { ContactForm } from './ContactForm';

/** AI-generated quick reply suggestion chips */
export { QuickReplies } from './QuickReplies';

/** Clickable call button for phone numbers in AI responses */
export { CallButton } from './CallButton';
export type { CallAction } from './CallButton';

/** Satisfaction rating prompt (1-5 stars with optional feedback) */
export { SatisfactionRating } from './SatisfactionRating';

/** Location picker for multi-location businesses */
export { LocationPicker } from './LocationPicker';

/** Voice recording UI - CSS-only animations (no motion/react) */
export { WidgetVoiceInput } from './WidgetVoiceInput';
export type { WidgetVoiceInputProps } from './WidgetVoiceInput';

/** File drop zone - CSS-only, no toast (uses inline errors) */
export { WidgetFileDropZone } from './WidgetFileDropZone';

/** File attachment display - for previews and message display */
export { WidgetFileAttachment, WidgetMessageFileAttachment } from './WidgetFileAttachment';

/** Audio player for voice messages - CSS-only animations (no motion/react) */
export { WidgetAudioPlayer } from './WidgetAudioPlayer';

/** Message reactions - CSS-only popover (no Radix, no motion/react) */
export { WidgetMessageReactions } from './WidgetMessageReactions';
export type { Reaction } from './WidgetMessageReactions';

/** Emoji picker - CSS-only tabs and scroll (no Radix, no motion/react) */
export { WidgetEmojiPicker, WidgetQuickEmojiPicker } from './WidgetEmojiPicker';

/** Phone input with country detection - uses libphonenumber-js/min, no motion/react */
export { WidgetPhoneInput } from './WidgetPhoneInput';
