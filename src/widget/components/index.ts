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

/** Human takeover notification banner */
export { TakeoverBanner } from './TakeoverBanner';

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

/** Satisfaction rating prompt (1-5 stars with optional feedback) */
export { SatisfactionRating } from './SatisfactionRating';

/** Location picker for multi-location businesses */
export { LocationPicker } from './LocationPicker';
