/**
 * FloatingButton Component
 * 
 * The circular floating action button that opens/closes the widget.
 * Displays the ChatPad logo when closed, X icon when open.
 * Adapts to system dark/light mode.
 * 
 * @module widget/components/FloatingButton
 */

import ChatPadLogo from '@/components/ChatPadLogo';
import { XClose } from '../icons';
import { useSystemTheme } from '../hooks/useSystemTheme';

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
  const theme = useSystemTheme();
  
  // Light mode: black button, white icon
  // Dark mode: white button, black icon
  const buttonBg = theme === 'dark' ? '#FFFFFF' : '#000000';
  const iconColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <button
      onClick={onClick}
      className="w-[50px] h-[50px] rounded-3xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
      style={{ backgroundColor: buttonBg }}
    >
      <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
        {isOpen ? (
          <XClose className="h-6 w-6" style={{ color: iconColor }} />
        ) : (
          <ChatPadLogo className="h-6 w-6" style={{ color: iconColor }} />
        )}
      </div>
    </button>
  );
};
