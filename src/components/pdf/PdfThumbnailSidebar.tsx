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
}

const THUMBNAIL_SCALE = 0.2; // Scale for thumbnail rendering

export function PdfThumbnailSidebar({
  pdfDoc,
  numPages,
  currentPage,
  onPageClick,
  isOpen,
  onToggle,
}: PdfThumbnailSidebarProps) {
  const thumbnailRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  // Render a single thumbnail
  const renderThumbnail = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || renderedPages.has(pageNum)) return;

      const canvas = thumbnailRefs.current.get(pageNum);
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
        
        // Account for device pixel ratio
        const pixelRatio = window.devicePixelRatio || 1;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.scale(pixelRatio, pixelRatio);

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        setRenderedPages((prev) => new Set(prev).add(pageNum));
      } catch (err) {
        console.error(`Failed to render thumbnail ${pageNum}:`, err);
      }
    },
    [pdfDoc, renderedPages]
  );

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
  }, [isOpen, pdfDoc, numPages, renderThumbnail]);

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
    <>
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="absolute left-2 top-2 z-10 h-7 w-7 p-0 bg-background/80 backdrop-blur-sm border border-border shadow-sm"
          aria-label="Show page thumbnails"
        >
          <LayoutLeft size={16} />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 border-r border-border bg-muted/50 transition-all duration-200 overflow-hidden',
          isOpen ? 'w-32' : 'w-0'
        )}
      >
        <div className="h-full flex flex-col">
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
    </>
  );
}

export default PdfThumbnailSidebar;
