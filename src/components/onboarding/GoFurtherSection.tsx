/**
 * Go Further Section Component
 * 
 * Displays advanced feature cards for users who want to explore more.
 * Shown below the main onboarding checklist.
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
  Calendar,
  Users01,
  Settings01
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
    description: 'Connect to your tools and automate workflows',
    route: '/ari',
  },
  {
    id: 'tools',
    icon: Tool02,
    title: 'Custom Tools',
    description: 'Add API-powered actions for Ari',
    route: '/ari',
  },
  {
    id: 'analytics',
    icon: BarChart01,
    title: 'Analytics',
    description: 'Track conversations and performance',
    route: '/analytics',
  },
];

export const GoFurtherSection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="mt-12 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Go further</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURE_CARDS.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, ...springs.smooth }}
            >
              <Link
                to={card.route}
                className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
