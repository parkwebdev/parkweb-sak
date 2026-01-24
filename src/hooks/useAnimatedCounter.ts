/**
 * @fileoverview Animated counter hook for smooth number transitions.
 * Counts up from 0 to target value with easing.
 */

import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface UseAnimatedCounterOptions {
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Delay before starting the animation in milliseconds */
  delay?: number;
  /** Easing function */
  easing?: (t: number) => number;
}

// Ease out cubic for smooth deceleration
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export function useAnimatedCounter(
  target: number,
  options: UseAnimatedCounterOptions = {}
): number {
  const { duration = 1000, delay = 0, easing = easeOutCubic } = options;
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    // Reset on target change
    setCount(0);

    const startAnimation = () => {
      startTimeRef.current = undefined;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        
        setCount(Math.round(easedProgress * target));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration, delay, easing, prefersReducedMotion]);

  return count;
}
