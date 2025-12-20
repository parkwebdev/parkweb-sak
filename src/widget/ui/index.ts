/**
 * Widget UI Components
 * 
 * Lightweight replacements for main app UI components.
 * These components avoid heavy dependencies (motion/react, @radix-ui)
 * while maintaining exact visual and functional parity.
 * 
 * @module widget/ui
 */

export { WidgetButton, widgetButtonVariants, type WidgetButtonProps } from './WidgetButton';
export { WidgetInput, widgetInputVariants } from './WidgetInput';
export { 
  WidgetSelect, 
  WidgetSelectTrigger, 
  WidgetSelectValue, 
  WidgetSelectContent, 
  WidgetSelectItem,
  widgetSelectTriggerVariants 
} from './WidgetSelect';
export { WidgetAvatar, WidgetAvatarImage, WidgetAvatarFallback } from './WidgetAvatar';
export { 
  WidgetCard, 
  WidgetCardHeader, 
  WidgetCardTitle, 
  WidgetCardDescription, 
  WidgetCardContent, 
  WidgetCardFooter 
} from './WidgetCard';
export { WidgetSpinner } from './WidgetSpinner';
export { WidgetCheckbox } from './WidgetCheckbox';
