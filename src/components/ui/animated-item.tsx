import React from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { 
  staggerItemVariants, 
  staggerItemScaleVariants,
  slideUpVariants,
  slideDownVariants,
  slideLeftVariants,
  slideRightVariants,
  springs,
  hoverLift,
  tapScale,
} from '@/lib/motion-variants';

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  /** Animation direction for slide animations */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Animation type */
  variant?: 'slide' | 'scale' | 'fade';
  /** Enable hover animation */
  whileHover?: boolean;
  /** Enable tap animation */
  whileTap?: boolean;
  /** Enable layout animations */
  layout?: boolean | 'position' | 'size';
  /** Custom layout ID for shared element transitions */
  layoutId?: string;
  /** Custom variants (overrides direction/variant) */
  customVariants?: Variants;
  /** Additional props passed to motion.div */
  motionProps?: React.ComponentProps<typeof motion.div>;
}

const getDirectionVariants = (direction: 'up' | 'down' | 'left' | 'right'): Variants => {
  switch (direction) {
    case 'down':
      return slideDownVariants;
    case 'left':
      return slideLeftVariants;
    case 'right':
      return slideRightVariants;
    case 'up':
    default:
      return slideUpVariants;
  }
};

const getVariantType = (variant: 'slide' | 'scale' | 'fade', direction: 'up' | 'down' | 'left' | 'right'): Variants => {
  switch (variant) {
    case 'scale':
      return staggerItemScaleVariants;
    case 'fade':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      };
    case 'slide':
    default:
      return getDirectionVariants(direction);
  }
};

export const AnimatedItem = ({ 
  children, 
  className,
  direction = 'up',
  variant = 'slide',
  whileHover = false,
  whileTap = false,
  layout = false,
  layoutId,
  customVariants,
  motionProps,
}: AnimatedItemProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Use custom variants if provided, otherwise build from props
  const variants = customVariants ?? getVariantType(variant, direction);

  // Reduced motion: instant opacity only
  const reducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 0, transition: { duration: 0 } },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={prefersReducedMotion ? reducedVariants : variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={whileHover && !prefersReducedMotion ? hoverLift : undefined}
      whileTap={whileTap && !prefersReducedMotion ? tapScale : undefined}
      layout={layout && !prefersReducedMotion ? layout : undefined}
      layoutId={layoutId}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedItem;
