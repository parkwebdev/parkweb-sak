import type { Variants, Transition } from 'motion/react';

// =============================================================================
// SPRING PHYSICS PRESETS
// =============================================================================

export const springs = {
  /** Snappy, responsive feel - good for buttons, toggles */
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  
  /** Smooth, natural movement - good for page transitions */
  smooth: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  
  /** Bouncy, playful feel - good for notifications, badges */
  bouncy: { type: 'spring', stiffness: 400, damping: 15 } as Transition,
  
  /** Gentle, slow movement - good for large elements */
  gentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  
  /** Quick micro-interaction */
  micro: { type: 'spring', stiffness: 500, damping: 35 } as Transition,
} as const;

// =============================================================================
// EASING PRESETS
// =============================================================================

export const easings = {
  /** Standard ease-out for entrances */
  easeOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  
  /** Standard ease-in for exits */
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  
  /** Smooth ease-in-out for transitions */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

// =============================================================================
// FADE VARIANTS
// =============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15, ease: easings.easeIn }
  },
};

export const fadeReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// =============================================================================
// SCALE VARIANTS
// =============================================================================

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springs.snappy
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15, ease: easings.easeIn }
  },
};

export const scaleReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// =============================================================================
// SLIDE VARIANTS
// =============================================================================

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
  exit: { 
    opacity: 0, 
    y: 8,
    transition: { duration: 0.15, ease: easings.easeIn }
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.15, ease: easings.easeIn }
  },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springs.smooth
  },
  exit: { 
    opacity: 0, 
    x: -8,
    transition: { duration: 0.15, ease: easings.easeIn }
  },
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springs.smooth
  },
  exit: { 
    opacity: 0, 
    x: 8,
    transition: { duration: 0.15, ease: easings.easeIn }
  },
};

export const slideReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// =============================================================================
// STAGGER CONTAINER VARIANTS
// =============================================================================

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFastVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlowVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

// =============================================================================
// STAGGER ITEM VARIANTS
// =============================================================================

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.1 }
  },
};

export const staggerItemScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springs.snappy
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
};

export const staggerItemReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

// =============================================================================
// INTERACTIVE VARIANTS (HOVER, TAP)
// =============================================================================

export const hoverLift = {
  scale: 1.02,
  y: -2,
  transition: springs.micro,
};

export const hoverGlow = {
  scale: 1.01,
  transition: springs.micro,
};

export const tapScale = {
  scale: 0.98,
  transition: springs.micro,
};

export const tapPress = {
  scale: 0.96,
  transition: springs.micro,
};

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

/** For cards with hover effect */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
  hover: {
    y: -4,
    transition: springs.micro,
  },
  tap: {
    scale: 0.99,
    transition: springs.micro,
  },
};

/** For list items */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springs.smooth
  },
  exit: { 
    opacity: 0, 
    x: 12,
    transition: { duration: 0.15 }
  },
};

/** For table rows */
export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  },
};

export const tableRowReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/** For message bubbles */
export const messageBubbleVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2, ease: easings.easeOut }
  },
};

export const messageBubbleUserVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2, ease: easings.easeOut }
  },
};

export const messageBubbleReducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

/** For modals and dialogs */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: springs.snappy
  },
  exit: { 
    opacity: 0, 
    scale: 0.97,
    transition: { duration: 0.15 }
  },
};

/** For overlay/backdrop */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** For sidebar collapse */
export const sidebarVariants: Variants = {
  expanded: { width: 'auto' },
  collapsed: { width: 56 },
};

/** For notifications/toasts */
export const notificationVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: springs.bouncy
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: 0.2 }
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get appropriate variants based on reduced motion preference
 */
export function getVariants(
  normalVariants: Variants, 
  reducedVariants: Variants, 
  prefersReducedMotion: boolean
): Variants {
  return prefersReducedMotion ? reducedVariants : normalVariants;
}

/**
 * Get appropriate transition based on reduced motion preference
 */
export function getTransition(
  normalTransition: Transition,
  prefersReducedMotion: boolean
): Transition {
  return prefersReducedMotion ? { duration: 0 } : normalTransition;
}
