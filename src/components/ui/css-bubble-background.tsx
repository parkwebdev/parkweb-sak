import * as React from 'react';
import { cn } from '@/lib/utils';

type CSSBubbleBackgroundProps = React.ComponentProps<'div'> & {
  colors?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
    fifth: string;
    sixth: string;
  };
  baseGradient?: {
    from: string;
    to: string;
  };
};

// Detect mobile devices for performance optimization
const getIsMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

function CSSBubbleBackground({
  ref,
  className,
  children,
  colors = {
    first: '18,113,255',
    second: '221,74,255',
    third: '0,220,255',
    fourth: '200,50,50',
    fifth: '180,180,50',
    sixth: '140,100,255',
  },
  baseGradient,
  ...props
}: CSSBubbleBackgroundProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(getIsMobile);
  
  React.useImperativeHandle(ref as any, () => containerRef.current as HTMLDivElement);

  // Update mobile detection on resize
  React.useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      data-slot="css-bubble-background"
      className={cn(
        'relative size-full overflow-hidden',
        className,
      )}
      style={{
        background: `linear-gradient(to bottom right, rgb(${baseGradient?.from || colors.first}), rgb(${baseGradient?.to || colors.second}))`,
      }}
      {...(props as any)}
    >
      <style>
        {`
          @keyframes moveVertical {
            0%, 100% { transform: translateY(-30%); }
            50% { transform: translateY(30%); }
          }
          
          @keyframes moveInCircle {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes moveInCircleReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          
          @keyframes moveHorizontal {
            0%, 100% { transform: translateX(-30%) translateY(-10%); }
            50% { transform: translateX(30%) translateY(10%); }
          }
          
          .bubble-1 {
            animation: moveVertical 20s ease-in-out infinite;
          }
          
          .bubble-2 {
            animation: moveInCircle 15s linear infinite;
          }
          
          .bubble-3 {
            animation: moveInCircleReverse 25s linear infinite;
          }
          
          .bubble-4 {
            animation: moveHorizontal 18s ease-in-out infinite;
          }
          
          .bubble-5 {
            animation: moveInCircle 22s linear infinite;
          }
          
          .bubble-6 {
            animation: moveInCircleReverse 28s linear infinite;
          }
        `}
      </style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-0 h-0"
      >
        <defs>
          <filter id="goo-css">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="12"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0"
        style={{ 
          // Mobile: Use CSS-only blur (better iOS Safari support, smoother rendering)
          // Desktop: Full SVG goo filter for lava lamp effect
          filter: isMobile ? 'blur(35px)' : 'url(#goo-css) blur(25px)' 
        }}
      >
        {/* Bubble 1 - Vertical movement */}
        <div
          className="bubble-1 absolute rounded-full size-[55%]"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors.first}, 0.8) 0%, rgba(${colors.first}, 0.5) 40%, rgba(${colors.first}, 0) 70%)`,
            top: '-10%',
            left: '5%',
          }}
        />

        {/* Bubble 2 - Circular movement */}
        <div
          className="bubble-2 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '45% 25%' }}
        >
          <div
            className="rounded-full size-[60%]"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.second}, 0.8) 0%, rgba(${colors.second}, 0.5) 40%, rgba(${colors.second}, 0) 70%)`,
            }}
          />
        </div>

        {/* Bubble 3 - Reverse circular movement */}
        <div
          className="bubble-3 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '35% 45%' }}
        >
          <div
            className="absolute rounded-full size-[50%]"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.third}, 0.8) 0%, rgba(${colors.third}, 0.5) 40%, rgba(${colors.third}, 0) 70%)`,
              top: '0%',
              left: '20%',
            }}
          />
        </div>

        {/* Bubble 4 - Horizontal movement */}
        <div
          className="bubble-4 absolute rounded-full size-[45%]"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors.fourth}, 0.8) 0%, rgba(${colors.fourth}, 0.5) 40%, rgba(${colors.fourth}, 0) 70%)`,
            top: '5%',
            left: '35%',
          }}
        />

        {/* Bubble 5 - Another circular movement */}
        <div
          className="bubble-5 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '55% 35%' }}
        >
          <div
            className="absolute rounded-full size-[65%]"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.fifth}, 0.8) 0%, rgba(${colors.fifth}, 0.5) 40%, rgba(${colors.fifth}, 0) 70%)`,
              top: '-15%',
              left: '15%',
            }}
          />
        </div>

        {/* Bubble 6 - Reverse circular at bottom */}
        <div
          className="bubble-6 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '50% 50%' }}
        >
          <div
            className="absolute rounded-full size-[40%]"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.sixth}, 0.8) 0%, rgba(${colors.sixth}, 0.5) 40%, rgba(${colors.sixth}, 0) 70%)`,
              top: '10%',
              left: '40%',
            }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}

export { CSSBubbleBackground, type CSSBubbleBackgroundProps };
