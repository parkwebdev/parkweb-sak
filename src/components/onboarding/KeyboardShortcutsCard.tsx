/**
 * Keyboard Shortcuts Card Component
 * 
 * Shows useful keyboard shortcuts for power users.
 * 
 * @module components/onboarding/KeyboardShortcutsCard
 */

import React from 'react';
import { Keyboard01 } from '@untitledui/icons';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ShortcutProps {
  keys: string[];
  description: string;
}

const Shortcut: React.FC<ShortcutProps> = ({ keys, description }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-muted-foreground">{description}</span>
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted border border-border rounded text-muted-foreground">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-[10px] text-muted-foreground">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export const KeyboardShortcutsCard: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const shortcuts = [
    { keys: ['Alt', 'A'], description: 'Open Ari' },
    { keys: ['Alt', 'C'], description: 'Go to Inbox' },
    { keys: ['Alt', 'L'], description: 'Go to Leads' },
    { keys: ['Alt', 'T'], description: 'Toggle theme' },
    { keys: ['Alt', 'K'], description: 'Global search' },
  ];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="flex-1 p-4 rounded-lg border border-border bg-card"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center text-muted-foreground">
          <Keyboard01 size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-foreground">Keyboard shortcuts</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              Power user
            </span>
          </div>
          <div className="space-y-2 mt-3">
            {shortcuts.map((shortcut) => (
              <Shortcut key={shortcut.description} {...shortcut} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
