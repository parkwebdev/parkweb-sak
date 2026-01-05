/**
 * Knowledge Base Table of Contents
 * 
 * Right sidebar showing article headings with scroll tracking.
 * 
 * @module components/knowledge-base/KBTableOfContents
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface KBTableOfContentsProps {
  headings: Heading[];
}

export function KBTableOfContents({ headings }: KBTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  
  // Track active heading based on scroll position
  useEffect(() => {
    if (headings.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );
    
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });
    
    return () => observer.disconnect();
  }, [headings]);
  
  // Smooth scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-0 p-4" aria-label="Table of contents">
      <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
        On This Page
      </h2>
      <ul className="space-y-1">
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          const isH3 = heading.level === 3;
          
          return (
            <li key={heading.id}>
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  'w-full text-left text-xs py-1 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded',
                  isH3 && 'pl-3',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="flex items-center gap-2">
                  {isActive && (
                    <span className="w-0.5 h-3.5 bg-foreground rounded-full" aria-hidden="true" />
                  )}
                  <span className={cn(!isActive && 'pl-2.5')}>
                    {heading.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
