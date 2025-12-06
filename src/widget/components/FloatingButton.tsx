import ChatPadLogo from '@/components/ChatPadLogo';

interface FloatingButtonProps {
  onClick: () => void;
  primaryColor: string;
  useGradientHeader: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
}

export const FloatingButton = ({
  onClick,
  primaryColor,
  useGradientHeader,
  gradientStartColor,
  gradientEndColor,
}: FloatingButtonProps) => {
  const getGradientStyle = () => {
    if (!useGradientHeader) return { backgroundColor: primaryColor };
    return { background: `linear-gradient(135deg, ${gradientStartColor} 0%, ${gradientEndColor} 100%)` };
  };

  return (
    <button
      onClick={onClick}
      className="w-[50px] h-[50px] rounded-3xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
      style={getGradientStyle()}
    >
      <ChatPadLogo className="h-6 w-6 text-white" />
    </button>
  );
};
