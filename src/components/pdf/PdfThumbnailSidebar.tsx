/**
 * PDF Thumbnail Sidebar Component
 * 
 * Displays page thumbnails for quick navigation in multi-page PDFs.
 * 
 * @module components/pdf/PdfThumbnailSidebar
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { LayoutLeft, ChevronLeft } from '@untitledui/icons';
import { cn } from '@/lib/utils';

/** Rotation mode for thumbnails */
export type ThumbnailRotationMode = 'auto' | 'respect' | 'ignore';

interface PdfThumbnailSidebarProps {
  /** PDF document proxy */
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  /** Total number of pages */
  numPages: number;
  /** Currently visible page */
  currentPage: number;
  /** Callback when a thumbnail is clicked */
  onPageClick: (pageNum: number) => void;
  /** Whether sidebar is open */
  isOpen: boolean;
  /** Toggle sidebar visibility */
  onToggle: () => void;
  /** Rotation mode for thumbnails */
  rotationMode?: ThumbnailRotationMode;
}

const THUMBNAIL_SCALE = 0.2; // Scale for thumbnail rendering

export function PdfThumbnailSidebar({
  pdfDoc,
  numPages,
  currentPage,
  onPageClick,
  isOpen,
  onToggle,
  rotationMode = 'auto',
}: PdfThumbnailSidebarProps) {
  const thumbnailRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const [detectedRotation, setDetectedRotation] = useState<number | null>(null);

  // Detect if PDF has inconsistent rotation metadata
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    const detectRotation = async () => {
      // Sample first few pages to detect rotation pattern
      const samplesToCheck = Math.min(5, numPages);
      const rotations: number[] = [];

      for (let i = 1; i <= samplesToCheck; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          rotations.push(page.rotate);
        } catch {
          rotations.push(0);
        }
      }

      // If page 1 has different rotation than majority of other pages,
      // we likely need to ignore rotation metadata
      const page1Rotation = rotations[0] ?? 0;
      const otherRotations = rotations.slice(1);
      const majorityDifferent = otherRotations.filter(r => r !== page1Rotation).length > otherRotations.length / 2;

      // Store the detected "should ignore" state
      // If majority of pages have different rotation than page 1, ignore all rotation
      if (majorityDifferent && otherRotations.length > 0) {
        setDetectedRotation(0); // Force rotation to 0
      } else {
        setDetectedRotation(null); // Let PDF.js handle it
      }
    };

    detectRotation();
  }, [pdfDoc, numPages]);

  // Determine effective rotation based on mode
  const getEffectiveRotation = useCallback((): number | undefined => {
    if (rotationMode === 'ignore') return 0;
    if (rotationMode === 'respect') return undefined;
    // Auto mode: use detected value
    return detectedRotation ?? undefined;
  }, [rotationMode, detectedRotation]);

  // Render a single thumbnail
  const renderThumbnail = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || renderedPages.has(pageNum)) return;

      const canvas = thumbnailRefs.current.get(pageNum);
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const effectiveRotation = getEffectiveRotation();
        // Apply rotation based on mode
        const viewport = page.getViewport({ 
          scale: THUMBNAIL_SCALE,
          rotation: effectiveRotation
        });

        const context = canvas.getContext('2d');
        if (!context) return;

        // Use transform pattern for HiDPI - avoids accumulated context transforms
        const pixelRatio = window.devicePixelRatio || 1;

        // Set canvas buffer size to physical pixels
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);

        // Set CSS size to maintain visual dimensions
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Reset context and clear before render
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Render with transform instead of context.scale() to avoid flip issues
        await page.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined,
        }).promise;

        setRenderedPages((prev) => new Set(prev).add(pageNum));
      } catch (err) {
        console.error(`Failed to render thumbnail ${pageNum}:`, err);
      }
    },
    [pdfDoc, renderedPages, getEffectiveRotation]
  );

  // Clear rendered pages when rotation mode changes
  useEffect(() => {
    setRenderedPages(new Set());
  }, [rotationMode, detectedRotation]);

  // Render all thumbnails when sidebar opens
  useEffect(() => {
    if (!isOpen || !pdfDoc || numPages === 0) return;

    // Render thumbnails with a small delay between each to avoid blocking
    const renderAllThumbnails = async () => {
      for (let i = 1; i <= numPages; i++) {
        await renderThumbnail(i);
      }
    };

    renderAllThumbnails();
  }, [isOpen, pdfDoc, numPages, renderThumbnail, rotationMode, detectedRotation]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (isOpen && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentPage, isOpen]);

  // Register canvas ref
  const setThumbnailRef = (pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      thumbnailRefs.current.set(pageNum, el);
    } else {
      thumbnailRefs.current.delete(pageNum);
    }
  };

  // Clear rendered pages when PDF changes
  useEffect(() => {
    setRenderedPages(new Set());
  }, [pdfDoc]);

  return (
    <div
      className={cn(
        'flex-shrink-0 border-r border-border bg-muted/50 overflow-hidden transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-32' : 'w-0'
      )}
    >
      <div 
        className={cn(
          'h-full flex flex-col w-32 transition-opacity duration-200 ease-in-out',
          isOpen ? 'opacity-100 delay-100' : 'opacity-0'
        )}
      >
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-2 border-b border-border bg-background/50">
            <span className="text-xs font-medium text-muted-foreground">Pages</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
              aria-label="Hide page thumbnails"
            >
              <ChevronLeft size={14} />
            </Button>
          </div>

          {/* Thumbnails container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                ref={pageNum === currentPage ? activeThumbRef : null}
                onClick={() => onPageClick(pageNum)}
                className={cn(
                  'w-full rounded-md overflow-hidden transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  currentPage === pageNum
                    ? 'ring-2 ring-primary shadow-md'
                    : 'ring-1 ring-border hover:ring-primary/50'
                )}
                aria-label={`Go to page ${pageNum}`}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                <div className="relative bg-white">
                  <canvas
                    ref={setThumbnailRef(pageNum)}
                    className="block w-full"
                  />
                  {/* Page number overlay */}
                  <div
                    className={cn(
                      'absolute bottom-0 left-0 right-0 py-0.5 text-2xs font-medium text-center',
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/90 text-muted-foreground'
                    )}
                  >
                    {pageNum}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
    </div>
  );
}

export default PdfThumbnailSidebar;
