import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DottedGlowBackgroundProps {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  darkColor?: string;
  glowColor?: string;
  darkGlowColor?: string;
  opacity?: number;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
}

interface Dot {
  x: number;
  y: number;
  speed: number;
  phase: number;
}

export const DottedGlowBackground: React.FC<DottedGlowBackgroundProps> = ({
  className,
  gap = 14,
  radius = 1.5,
  color = 'rgba(255, 255, 255, 0.5)',
  darkColor = 'rgba(255, 255, 255, 0.7)',
  glowColor = 'rgba(0, 170, 255, 0.85)',
  darkGlowColor = 'rgba(0, 170, 255, 1)',
  opacity = 0.8,
  backgroundOpacity = 0.3,
  speedMin = 0.5,
  speedMax = 1.5,
  speedScale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initializeDots();
    };

    const initializeDots = () => {
      const cols = Math.ceil(canvas.width / gap);
      const rows = Math.ceil(canvas.height / gap);
      dotsRef.current = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          dotsRef.current.push({
            x: col * gap,
            y: row * gap,
            speed: speedMin + Math.random() * (speedMax - speedMin),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background dots with reduced opacity
      dotsRef.current.forEach((dot) => {
        const alpha = backgroundOpacity;
        ctx.fillStyle = color.replace(/[\d.]+\)$/g, `${alpha})`);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw animated glowing dots
      dotsRef.current.forEach((dot) => {
        const animationProgress = (Math.sin(time * 0.001 * dot.speed * speedScale + dot.phase) + 1) / 2;
        const alpha = animationProgress * opacity;

        if (animationProgress > 0.3) {
          // Draw glow effect
          ctx.shadowBlur = 15 * animationProgress;
          ctx.shadowColor = glowColor;
          
          const gradientRadius = radius * (1 + animationProgress * 2);
          const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, gradientRadius);
          gradient.addColorStop(0, darkGlowColor.replace(/[\d.]+\)$/g, `${alpha})`));
          gradient.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/g, `${alpha * 0.5})`));
          gradient.addColorStop(1, glowColor.replace(/[\d.]+\)$/g, '0)'));

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, gradientRadius, 0, Math.PI * 2);
          ctx.fill();

          // Draw core dot
          ctx.shadowBlur = 5;
          ctx.fillStyle = darkColor.replace(/[\d.]+\)$/g, `${alpha})`);
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gap, radius, color, darkColor, glowColor, darkGlowColor, opacity, backgroundOpacity, speedMin, speedMax, speedScale]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full', className)}
    />
  );
};
