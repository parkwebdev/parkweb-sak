/**
 * Video Placeholder Component
 * 
 * Video player for onboarding steps using self-hosted videos from AWS.
 * Falls back to gradient placeholder if video URL not yet configured.
 * 
 * @module components/onboarding/VideoPlaceholder
 */

import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { VideoPlayer } from '@/components/base/video-player/video-player';
import { PlayTriangleIcon } from '@/components/icons/PlayTriangleIcon';

interface VideoPlaceholderProps {
  stepId: string;
}

/**
 * Step-specific video configurations (AWS S3/CloudFront URLs)
 * Replace these placeholder URLs with actual video URLs when available
 */
const STEP_VIDEOS: Record<string, { src: string; thumbnail: string }> = {
  // Placeholder structure - update with actual AWS URLs when videos are uploaded
  // personality: { 
  //   src: 'https://your-cdn.cloudfront.net/onboarding/personality.mp4',
  //   thumbnail: 'https://your-cdn.cloudfront.net/onboarding/personality-thumb.webp'
  // },
};

/**
 * Step-specific gradient configurations (fallback when no video)
 */
const STEP_GRADIENTS: Record<string, string> = {
  personality: 'from-violet-600 via-purple-500 to-fuchsia-500',
  knowledge: 'from-blue-600 via-cyan-500 to-teal-500',
  appearance: 'from-orange-500 via-amber-500 to-yellow-500',
  installation: 'from-emerald-600 via-green-500 to-lime-500',
  test: 'from-rose-600 via-pink-500 to-fuchsia-500',
  locations: 'from-sky-600 via-blue-500 to-indigo-500',
  'help-articles': 'from-teal-600 via-emerald-500 to-green-500',
  announcements: 'from-amber-600 via-orange-500 to-red-500',
  news: 'from-indigo-600 via-purple-500 to-pink-500',
  'whats-next': 'from-violet-600 via-purple-500 to-fuchsia-500',
};

const DEFAULT_GRADIENT = STEP_GRADIENTS.personality;

/**
 * Gradient placeholder for steps without videos yet
 */
function GradientPlaceholder({ stepId }: { stepId: string }) {
  const prefersReducedMotion = useReducedMotion();
  const gradient = STEP_GRADIENTS[stepId] || DEFAULT_GRADIENT;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepId}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br ${gradient} shadow-lg`}
      >
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="group flex items-center justify-center w-20 h-20 rounded-full bg-white/50 backdrop-blur-sm shadow-md hover:bg-white/60 transition-colors"
            aria-label="Video coming soon"
            disabled
          >
            <PlayTriangleIcon size={32} className="text-white/80 ml-1" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function VideoPlaceholder({ stepId }: VideoPlaceholderProps) {
  const video = STEP_VIDEOS[stepId];
  
  // If no video configured yet, show gradient placeholder
  if (!video) {
    return <GradientPlaceholder stepId={stepId} />;
  }
  
  // Show native video player
  return (
    <VideoPlayer
      size="lg"
      src={video.src}
      thumbnailUrl={video.thumbnail}
      title={`${stepId} tutorial`}
      className="aspect-video w-full h-full min-h-[280px] overflow-hidden rounded-xl"
    />
  );
}
