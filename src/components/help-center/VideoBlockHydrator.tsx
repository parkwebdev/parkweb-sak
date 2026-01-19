/**
 * VideoBlockHydrator
 * 
 * Hydrates [data-video] DOM elements into interactive HelpCenterVideoPlayer components
 * using React portals. This enables video playback in HTML content rendered from
 * the database.
 * 
 * Uses self-hosted videos from AWS S3/CloudFront.
 * 
 * @module components/help-center/VideoBlockHydrator
 */

import { useState, useEffect, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { HelpCenterVideoPlayer } from './HelpCenterVideoPlayer';

interface VideoBlockHydratorProps {
  /** Ref to the container element to scan for [data-video] elements */
  containerRef: RefObject<HTMLElement>;
  /** Key to trigger re-hydration (e.g., article slug) */
  contentKey?: string;
}

interface VideoData {
  element: HTMLElement;
  src: string;
  title: string;
  thumbnail: string;
}

/**
 * Scans a container for [data-video] elements and renders HelpCenterVideoPlayer
 * components inside them using React portals.
 */
export function VideoBlockHydrator({ containerRef, contentKey }: VideoBlockHydratorProps) {
  const [videoElements, setVideoElements] = useState<VideoData[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      
      // Find all [data-video] elements
      const elements = Array.from(
        containerRef.current.querySelectorAll('[data-video]')
      ) as HTMLElement[];
      
      const videos = elements.map((el) => {
        const src = el.getAttribute('data-src') || '';
        const title = el.getAttribute('data-title') || '';
        const thumbnail = el.getAttribute('data-thumbnail') || '';
        
        return {
          element: el,
          src,
          title,
          thumbnail,
        };
      });
      
      setVideoElements(videos);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [contentKey, containerRef]);

  if (videoElements.length === 0) return null;

  return (
    <>
      {videoElements.map((video, index) => 
        createPortal(
          <HelpCenterVideoPlayer
            key={`${contentKey}-video-${index}`}
            src={video.src}
            thumbnail={video.thumbnail}
            title={video.title}
          />,
          video.element
        )
      )}
    </>
  );
}
