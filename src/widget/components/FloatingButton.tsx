/**
 * FloatingButton Component
 * 
 * The circular floating action button that opens/closes the widget.
 * Displays the ChatPad logo when closed, X icon when open.
 * 
 * @module widget/components/FloatingButton
 */

import ChatPadLogo from '@/components/ChatPadLogo';
import { XClose } from '@untitledui/icons';

/** Props for the FloatingButton component */
interface FloatingButtonProps {
  /** Click handler for button interaction */
  onClick: () => void;
  /** Primary brand color (fallback for non-gradient mode) */
  primaryColor: string;
  /** Whether to use gradient background */
  useGradientHeader: boolean;
  /** Gradient start color (top-left) */
  gradientStartColor: string;
  /** Gradient end color (bottom-right) */
  gradientEndColor: string;
  /** Whether the widget is currently open */
  isOpen?: boolean;
}

/**
 * Floating action button component for widget toggle.
 * 
 * @param props - Component props
 * @returns Styled button element with ChatPad logo or X icon
 */
export const FloatingButton = ({
  onClick,
  primaryColor,
  useGradientHeader,
  gradientStartColor,
  gradientEndColor,
  isOpen = false,
}: FloatingButtonProps) => {
  const getGradientStyle = () => {
    if (!useGradientHeader) return { backgroundColor: primaryColor };
    return { background: `linear-gradient(135deg, ${gradientStartColor} 0%, ${gradientEndColor} 100%)` };
  };

  return (
    <button
      onClick={onClick}
      className="w-[50px] h-[50px] rounded-3xl flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
      style={getGradientStyle()}
    >
      <div className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
        {isOpen ? (
          <XClose className="h-6 w-6 text-white" />
        ) : (
          <ChatPadLogo className="h-6 w-6 text-white" />
        )}
      </div>
    </button>
  );
};
