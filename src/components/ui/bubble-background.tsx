import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface BubbleBackgroundProps {
  className?: string;
  interactive?: boolean;
  primaryColor?: string;
  gradientEndColor?: string;
}

export const BubbleBackground = ({ 
  className, 
  interactive = false,
  primaryColor = '#000000',
  gradientEndColor = '#1e40af'
}: BubbleBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${gradientEndColor} 100%)`,
      }}
    >
      {/* Animated bubbles */}
      <div className="absolute inset-0">
        {/* Large bubble - top right */}
        <div 
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-30 animate-pulse"
          style={{
            background: hexToRgba(gradientEndColor, 0.6),
            top: '-10%',
            right: '-10%',
            animationDuration: '4s',
          }}
        />
        
        {/* Medium bubble - bottom left */}
        <div 
          className="absolute w-48 h-48 rounded-full blur-2xl opacity-20 animate-pulse"
          style={{
            background: hexToRgba('#ffffff', 0.3),
            bottom: '-5%',
            left: '-5%',
            animationDuration: '6s',
            animationDelay: '1s',
          }}
        />
        
        {/* Small bubble - center */}
        <div 
          className="absolute w-32 h-32 rounded-full blur-xl opacity-25 animate-pulse"
          style={{
            background: hexToRgba(primaryColor, 0.5),
            top: '40%',
            left: '30%',
            animationDuration: '5s',
            animationDelay: '2s',
          }}
        />
        
        {/* Interactive cursor follower */}
        {interactive && (
          <div
            className="absolute w-24 h-24 rounded-full blur-2xl opacity-20 transition-all duration-300 pointer-events-none"
            style={{
              background: hexToRgba('#ffffff', 0.4),
              transform: `translate(${mousePosition.x - 48}px, ${mousePosition.y - 48}px)`,
            }}
          />
        )}
      </div>

      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
