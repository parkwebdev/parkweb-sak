'use client';

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
  React.useImperativeHandle(ref as any, () => containerRef.current as HTMLDivElement);

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
            0%, 100% { transform: translateY(-50%); }
            50% { transform: translateY(50%); }
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
            0%, 100% { transform: translateX(-50%) translateY(-10%); }
            50% { transform: translateX(50%) translateY(10%); }
          }
          
          .bubble-1 {
            animation: moveVertical 30s ease-in-out infinite;
          }
          
          .bubble-2 {
            animation: moveInCircle 20s linear infinite;
          }
          
          .bubble-3 {
            animation: moveInCircleReverse 40s linear infinite;
          }
          
          .bubble-4 {
            animation: moveHorizontal 40s ease-in-out infinite;
          }
          
          .bubble-5 {
            animation: moveInCircle 20s linear infinite;
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
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0"
        style={{ filter: 'url(#goo-css) blur(40px)' }}
      >
        {/* Bubble 1 - Vertical movement */}
        <div
          className="bubble-1 absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors.first}, 0.8) 0%, rgba(${colors.first}, 0) 50%)`,
          }}
        />

        {/* Bubble 2 - Circular movement */}
        <div
          className="bubble-2 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: 'calc(50% - 400px)' }}
        >
          <div
            className="rounded-full size-[80%] mix-blend-hard-light"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.second}, 0.8) 0%, rgba(${colors.second}, 0) 50%)`,
            }}
          />
        </div>

        {/* Bubble 3 - Reverse circular movement */}
        <div
          className="bubble-3 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: 'calc(50% + 400px)' }}
        >
          <div
            className="absolute rounded-full size-[80%] mix-blend-hard-light"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.third}, 0.8) 0%, rgba(${colors.third}, 0) 50%)`,
              top: 'calc(50% + 200px)',
              left: 'calc(50% - 500px)',
            }}
          />
        </div>

        {/* Bubble 4 - Horizontal movement */}
        <div
          className="bubble-4 absolute rounded-full size-[80%] top-[10%] left-[10%] mix-blend-hard-light opacity-70"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors.fourth}, 0.8) 0%, rgba(${colors.fourth}, 0) 50%)`,
          }}
        />

        {/* Bubble 5 - Another circular movement */}
        <div
          className="bubble-5 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: 'calc(50% - 800px) calc(50% + 200px)' }}
        >
          <div
            className="absolute rounded-full size-[160%] mix-blend-hard-light"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.fifth}, 0.8) 0%, rgba(${colors.fifth}, 0) 50%)`,
              top: 'calc(50% - 80%)',
              left: 'calc(50% - 80%)',
            }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}

export { CSSBubbleBackground, type CSSBubbleBackgroundProps };
