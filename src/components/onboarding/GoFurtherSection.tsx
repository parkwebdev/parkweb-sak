/**
 * Go Further Section Component
 * 
 * Displays advanced feature cards for users who want to explore more.
 * Simpler card style matching Intercom's onboarding aesthetic.
 * 
 * @module components/onboarding/GoFurtherSection
 */

import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Link01, 
  Tool02, 
  BarChart01,
} from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';

interface FeatureCard {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  route: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'webhooks',
    icon: Link01,
    title: 'Webhooks',
    description: 'Connect to your tools',
    route: '/ari',
  },
  {
    id: 'tools',
    icon: Tool02,
    title: 'Custom Tools',
    description: 'Add API actions',
    route: '/ari',
  },
  {
    id: 'analytics',
    icon: BarChart01,
    title: 'Analytics',
    description: 'Track performance',
    route: '/analytics',
  },
];

export const GoFurtherSection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Go further</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURE_CARDS.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05, ...springs.smooth }}
            >
              <Link
                to={card.route}
                className="block bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-sm font-medium text-foreground">{card.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
