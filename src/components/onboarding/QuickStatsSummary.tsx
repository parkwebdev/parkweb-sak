/**
 * Quick Stats Summary Component
 * 
 * Displays 3 stat cards showing configured knowledge sources, locations, and help articles.
 * Each card is clickable and navigates to the relevant Ari section.
 * 
 * @module components/onboarding/QuickStatsSummary
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database01, MarkerPin01, BookOpen01 } from '@untitledui/icons';
import { motion } from 'motion/react';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useLocations } from '@/hooks/useLocations';
import { useHelpArticles } from '@/hooks/useHelpArticles';
import { useAgent } from '@/hooks/useAgent';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StatCardProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  onClick: () => void;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, count, label, onClick, index }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={onClick}
      className="flex-1 flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.button>
  );
};

export const QuickStatsSummary: React.FC = () => {
  const navigate = useNavigate();
  const { agent } = useAgent();
  const { sources } = useKnowledgeSources();
  const { locations } = useLocations();
  const { articles } = useHelpArticles(agent?.id || '');

  const stats = [
    {
      icon: <Database01 size={20} />,
      count: sources?.length || 0,
      label: 'Knowledge Sources',
      onClick: () => navigate('/ari', { state: { section: 'knowledge' } }),
    },
    {
      icon: <MarkerPin01 size={20} />,
      count: locations?.length || 0,
      label: 'Locations',
      onClick: () => navigate('/ari', { state: { section: 'locations' } }),
    },
    {
      icon: <BookOpen01 size={20} />,
      count: articles?.length || 0,
      label: 'Help Articles',
      onClick: () => navigate('/ari', { state: { section: 'help-articles' } }),
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} index={index} />
      ))}
    </div>
  );
};
