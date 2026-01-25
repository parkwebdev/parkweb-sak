/**
 * Help Center Article Card
 * 
 * Displays an article preview card for category landing pages.
 * Now uses DB-driven types from usePlatformHelpCenter.
 * 
 * @module components/help-center/HCArticleCard
 */

import { motion } from 'motion/react';
import { ArrowRight } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import type { PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';

interface HCArticleCardProps {
  article: PlatformHCArticle;
  categoryColor: string;
  onClick: () => void;
}

export function HCArticleCard({ article, categoryColor, onClick }: HCArticleCardProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'group w-full text-left p-4 rounded-card border border-border bg-card',
        'transition-colors hover:border-border/80 hover:bg-accent/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={springs.snappy}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category dot + Title */}
          <div className="flex items-center gap-2 mb-1.5">
            <span 
              className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', categoryColor)} 
              aria-hidden="true" 
            />
            <h3 className="text-sm font-medium text-foreground truncate">
              {article.title}
            </h3>
          </div>
          
          {/* Description */}
          {article.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 pl-3.5">
              {article.description}
            </p>
          )}
        </div>
        
        {/* Arrow indicator */}
        <ArrowRight 
          size={16} 
          className="text-muted-foreground/50 group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" 
          aria-hidden="true"
        />
      </div>
    </motion.button>
  );
}
