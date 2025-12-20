/**
 * FloatingButton Component
 * 
 * The circular floating action button that opens/closes the widget.
 * Displays the ChatPad logo when closed, X icon when open.
 * Adapts to system dark/light mode.
 * 
 * @module widget/components/FloatingButton
 */

import { ChevronDown } from '../icons';
import { useTheme } from '@/components/ThemeProvider';

/** Chat bubble logo SVG path */
const ChatBubbleLogoPath = "M119.03 0H11.07C4.95 0 0 4.95 0 11.07v107.96c0 6.11 4.95 11.07 11.07 11.07l64.98-.1c19.77 0 26.87 7.95 40.85 21.93 4.87 4.87 13.2 1.42 13.2-5.47V11.07C130.1 4.96 125.15 0 119.03 0m-14.78 64.47c0 .58-.47 1.06-1.06 1.06h-4.93c-3.45 0-6.85.54-10.07 1.58-4.89 1.58-7.21 7.05-4.89 11.55 1.53 2.96 3.53 5.69 5.98 8.08l3.46 3.39c.42.42.42 1.1 0 1.51l-.02.02c-.41.4-1.07.4-1.48 0l-3.49-3.42a32.4 32.4 0 0 0-8.26-5.85c-4.6-2.27-10.2 0-11.81 4.78a30.9 30.9 0 0 0-1.62 9.85v4.8c0 .58-.47 1.06-1.06 1.06h-.05c-.58 0-1.06-.47-1.06-1.06v-4.8c0-3.38-.56-6.7-1.62-9.85-1.61-4.79-7.21-7.05-11.81-4.78a32 32 0 0 0-8.26 5.85l-3.49 3.42c-.41.4-1.07.4-1.48 0l-.02-.02c-.42-.42-.42-1.1 0-1.51l3.46-3.39c2.44-2.39 4.45-5.12 5.98-8.08 2.32-4.5 0-9.97-4.89-11.55a32.8 32.8 0 0 0-10.07-1.58h-4.93a1.06 1.06 0 0 1 0-2.12h4.93c3.45 0 6.85-.54 10.07-1.58 4.89-1.58 7.21-7.05 4.89-11.55a31.4 31.4 0 0 0-5.98-8.08l-3.46-3.39c-.42-.42-.42-1.1 0-1.51l.02-.02c.41-.4 1.07-.4 1.48 0l3.49 3.42a32.4 32.4 0 0 0 8.26 5.85c4.6 2.27 10.2 0 11.81-4.78 1.06-3.15 1.62-6.47 1.62-9.85v-4.8c0-.58.47-1.06 1.06-1.06H65c.58 0 1.06.47 1.06 1.06v4.8c0 3.38.56 6.7 1.62 9.85 1.61 4.79 7.21 7.05 11.81 4.78 3.03-1.49 5.82-3.46 8.26-5.85l3.49-3.42c.41-.4 1.07-.4 1.48 0l.02.02c.42.42.42 1.1 0 1.51l-3.46 3.39a31.7 31.7 0 0 0-5.98 8.08c-2.32 4.5 0 9.97 4.89 11.55 3.22 1.04 6.62 1.58 10.07 1.58h4.93c.58 0 1.06.47 1.06 1.06";

/** Props for the FloatingButton component */
interface FloatingButtonProps {
  /** Click handler for button interaction */
  onClick: () => void;
  /** Whether the widget is currently open */
  isOpen?: boolean;
}

/**
 * Floating action button component for widget toggle.
 * Light mode: black button, white icon
 * Dark mode: white button, black icon
 * 
 * @param props - Component props
 * @returns Styled button element with ChatPad logo or X icon
 */
export const FloatingButton = ({
  onClick,
  isOpen = false,
}: FloatingButtonProps) => {
  const { theme } = useTheme();
  
  // Resolve effective theme (handle 'system' setting)
  const effectiveTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  
  // Light mode: black button, white icon
  // Dark mode: white button, black icon
  const buttonBg = effectiveTheme === 'dark' ? '#FFFFFF' : '#000000';
  const iconColor = effectiveTheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <button
      onClick={onClick}
      className="w-[50px] h-[50px] rounded-3xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
      style={{ backgroundColor: buttonBg }}
    >
      <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
        {isOpen ? (
          <ChevronDown className="h-6 w-6 rotate-180" style={{ color: iconColor }} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 130.1 154.21"
            className="h-7 w-7"
            style={{ fill: iconColor }}
          >
            <path d={ChatBubbleLogoPath} />
          </svg>
        )}
      </div>
    </button>
  );
};
