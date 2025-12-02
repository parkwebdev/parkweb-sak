import { useEffect, useState } from 'react';
import ChatPadLogo from '@/components/ChatPadLogo';

const loadingMessages = [
  "Loading widget...",
  "Connecting to ChatPad...",
  "Almost ready..."
];

interface WidgetLoaderProps {
  primaryColor?: string;
}

export const WidgetLoader = ({ primaryColor = '#000000' }: WidgetLoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        setIsTransitioning(false);
      }, 200);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center bg-transparent light"
      style={{
        colorScheme: 'light',
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
        '--muted-foreground': '215.4 16.3% 46.9%',
      } as React.CSSProperties}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation */}
        <div className="widget-loader-logo">
          <ChatPadLogo className="h-10 w-10" style={{ color: primaryColor }} />
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full widget-progress-bar rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        {/* Transitioning text */}
        <p 
          className={`text-sm text-muted-foreground transition-opacity duration-200 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {loadingMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default WidgetLoader;
