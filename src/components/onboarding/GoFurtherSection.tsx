/**
 * Go Further Section Component
 * 
 * Displays advanced feature cards for users who want to explore more.
 * Simpler card style matching Intercom's onboarding aesthetic.
 * 
 * @module components/onboarding/GoFurtherSection
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { PieChart01 } from '@untitledui/icons';
import { Webhook, WebhookFilled, CodeBrowser, CodeBrowserFilled } from '@/components/icons/AriMenuIcons';
import { AnalyticsFilled } from '@/components/icons/SidebarIcons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';

interface FeatureCard {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeIcon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  route: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'webhooks',
    icon: Webhook,
    activeIcon: WebhookFilled,
    title: 'Webhooks',
    description: 'Connect to your tools',
    route: '/ari?section=webhooks',
  },
  {
    id: 'tools',
    icon: CodeBrowser,
    activeIcon: CodeBrowserFilled,
    title: 'Custom Tools',
    description: 'Add API actions',
    route: '/ari?section=custom-tools',
  },
  {
    id: 'analytics',
    icon: PieChart01,
    activeIcon: AnalyticsFilled,
    title: 'Analytics',
    description: 'Track performance',
    route: '/analytics',
  },
];

const FeatureCardItem: React.FC<{ card: FeatureCard; index: number; prefersReducedMotion: boolean }> = ({
  card,
  index,
  prefersReducedMotion,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = isHovered ? card.activeIcon : card.icon;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring' as const, 
        stiffness: 300, 
        damping: 24,
        delay: index * 0.05
      }
    },
  };

  return (
    <motion.div
      key={card.id}
      variants={itemVariants}
      whileHover={prefersReducedMotion ? {} : { y: -2, scale: 1.02 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
    >
      <Link
        to={card.route}
        className="block bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2">
          <motion.div
            initial={false}
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
          <span className="text-sm font-medium text-foreground">{card.title}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {card.description}
        </p>
      </Link>
    </motion.div>
  );
};

export const GoFurtherSection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  } as const;

  const headerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    },
  };

  return (
    <motion.section 
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      variants={containerVariants}
      className="mt-10 space-y-3"
    >
      <motion.h2 
        variants={headerVariants}
        className="text-sm font-medium text-muted-foreground"
      >
        Go further
      </motion.h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURE_CARDS.map((card, index) => (
          <FeatureCardItem
            key={card.id}
            card={card}
            index={index}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </motion.section>
  );
};
