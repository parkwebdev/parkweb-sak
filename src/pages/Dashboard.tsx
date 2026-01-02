/**
 * Dashboard Page
 * 
 * Post-onboarding home page for admins.
 * Shows "What's next?" content with helpful resources and team invite.
 * 
 * @module pages/Dashboard
 */

import React from 'react';
import { ArrowUpRight } from '@untitledui/icons';
import { motion } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { InviteTeamInline } from '@/components/onboarding/InviteTeamInline';
import { GoFurtherSection } from '@/components/onboarding';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { logger } from '@/utils/logger';

export function Dashboard() {
  const prefersReducedMotion = useReducedMotion();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    },
  };

  return (
    <main className="flex-1 min-h-0 h-full overflow-y-auto bg-background flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full py-4 lg:py-8">
        {/* Header */}
        <header className="w-full font-medium">
          <div className="items-stretch flex w-full flex-col gap-2 px-4 lg:px-8 py-0">
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Your command center for Ari
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 lg:px-8 pb-8 pt-6">
          {/* What's next card */}
          <motion.div 
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="border border-border rounded-xl bg-card shadow-sm p-6"
          >
            {/* Two-column layout: content left, video right */}
            <div className="flex gap-6">
              {/* Left column: Text content */}
              <motion.div 
                className="flex-1 min-w-0 flex flex-col"
                variants={containerVariants}
                initial={prefersReducedMotion ? false : "hidden"}
                animate="visible"
              >
                <motion.h2 
                  variants={itemVariants}
                  className="text-base font-medium text-foreground mb-1"
                >
                  What's next?
                </motion.h2>
                <motion.p 
                  variants={itemVariants}
                  className="text-sm text-muted-foreground leading-relaxed mb-4"
                >
                  You're all set up! Explore more features or check out helpful resources to get the most out of Ari.
                </motion.p>
                <motion.div variants={itemVariants} className="mb-4">
                  <a 
                    href="https://docs.lovable.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                  >
                    Explore the Help Center
                    <motion.span
                      className="inline-block"
                      whileHover={{ x: 2, y: -2 }}
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                    >
                      <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </motion.span>
                  </a>
                </motion.div>

                {/* Divider and Invite Team inline */}
                <motion.div variants={itemVariants}>
                  <Separator className="my-4" />
                  <InviteTeamInline />
                </motion.div>
              </motion.div>

              {/* Right column: Video placeholder */}
              <motion.div 
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.2 }}
                className="hidden sm:flex w-72 md:w-96 lg:w-[28rem] flex-shrink-0"
              >
                <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 shadow-lg group">
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                      className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md shadow-lg hover:bg-white/30 transition-colors"
                      onClick={() => {
                        // TODO: Open video modal
                        logger.debug('Play next level video');
                      }}
                      aria-label="Play tutorial video"
                    >
                      <PlayIcon size={32} className="text-white group-hover:text-white/90 transition-colors" />
                    </motion.button>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-white/20 backdrop-blur-sm text-xs text-white font-medium">
                    3:24
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Go Further section */}
          <GoFurtherSection />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
