/**
 * Completion Celebration Component
 * 
 * Full-screen confetti animation when all onboarding steps are complete.
 * Auto-dismisses after animation completes.
 * 
 * @module components/onboarding/CompletionCelebration
 */

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

interface CompletionCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)', // emerald
  'hsl(217 91% 60%)', // blue
  'hsl(280 65% 60%)', // purple
  'hsl(45 93% 47%)',  // amber
  'hsl(330 81% 60%)', // pink
];

export function CompletionCelebration({
  show,
  onComplete,
}: CompletionCelebrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(show);

  // Generate confetti pieces
  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
  }, []);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, prefersReducedMotion ? 1000 : 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, prefersReducedMotion]);

  if (prefersReducedMotion && show) {
    // Simple fade for reduced motion
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-foreground">All done!</h2>
              <p className="text-muted-foreground mt-1">Ari is ready to go</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
        >
          {/* Confetti pieces */}
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                y: -20, 
                x: `${piece.x}vw`,
                rotate: piece.rotation,
                opacity: 1,
              }}
              animate={{ 
                y: '110vh',
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeIn',
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}

          {/* Center message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl text-center">
              <motion.div 
                className="text-5xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                🎉
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">All done!</h2>
              <p className="text-muted-foreground mt-1">Ari is ready to go</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
