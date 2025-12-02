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
            animation: moveVertical 25s ease-in-out infinite;
          }
          
          .bubble-2 {
            animation: moveInCircle 18s linear infinite;
          }
          
          .bubble-3 {
            animation: moveInCircleReverse 35s linear infinite;
          }
          
          .bubble-4 {
            animation: moveHorizontal 28s ease-in-out infinite;
          }
          
          .bubble-5 {
            animation: moveInCircle 22s linear infinite;
          }
          
          .bubble-6 {
            animation: moveInCircleReverse 32s linear infinite;
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
          className="bubble-1 absolute rounded-full size-[50%] mix-blend-hard-light"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors.first}, 0.8) 0%, rgba(${colors.first}, 0) 50%)`,
            top: '-15%',
            left: '-5%',
          }}
        />

        {/* Bubble 2 - Circular movement */}
        <div
          className="bubble-2 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '70% 40%' }}
        >
          <div
            className="rounded-full size-[60%] mix-blend-hard-light"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.second}, 0.8) 0%, rgba(${colors.second}, 0) 50%)`,
            }}
          />
        </div>

        {/* Bubble 3 - Reverse circular movement */}
        <div
          className="bubble-3 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '30% 60%' }}
        >
          <div
            className="absolute rounded-full size-[50%] mix-blend-hard-light"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.third}, 0.8) 0%, rgba(${colors.third}, 0) 50%)`,
              top: '-10%',
              left: '20%',
            }}
          />
        </div>

        {/* Bubble 4 - Horizontal movement */}
        <div
          className="bubble-4 absolute rounded-full size-[45%] mix-blend-hard-light opacity-70"
          style={{
            background: `radial-gradient(circle at center, rgba(${colors.fourth}, 0.8) 0%, rgba(${colors.fourth}, 0) 50%)`,
            top: '5%',
            left: '50%',
          }}
        />

        {/* Bubble 5 - Another circular movement */}
        <div
          className="bubble-5 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '50% 30%' }}
        >
          <div
            className="absolute rounded-full size-[70%] mix-blend-hard-light"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.fifth}, 0.8) 0%, rgba(${colors.fifth}, 0) 50%)`,
              top: '-20%',
              left: '10%',
            }}
          />
        </div>

        {/* Bubble 6 - Reverse circular at bottom */}
        <div
          className="bubble-6 absolute inset-0 flex justify-center items-center"
          style={{ transformOrigin: '60% 50%' }}
        >
          <div
            className="absolute rounded-full size-[40%] mix-blend-hard-light opacity-80"
            style={{
              background: `radial-gradient(circle at center, rgba(${colors.sixth}, 0.8) 0%, rgba(${colors.sixth}, 0) 50%)`,
              top: '10%',
              left: '60%',
            }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}

export { CSSBubbleBackground, type CSSBubbleBackgroundProps };
