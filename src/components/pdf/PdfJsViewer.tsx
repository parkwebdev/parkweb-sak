/**
 * PDF.js Viewer Component
 * 
 * Renders PDF documents using PDF.js library, bypassing browser PDF embeds.
 * This works even when extensions or policies block blob: URLs and native viewers.
 * 
 * @module components/pdf/PdfJsViewer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Loading02, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Expand01, LayoutLeft, RefreshCcw01 } from '@untitledui/icons';
import { PdfThumbnailSidebar, ThumbnailRotationMode } from './PdfThumbnailSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import the worker directly - Vite will bundle it locally
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface PdfJsViewerProps {
  /** PDF data as ArrayBuffer or Uint8Array */
  data: ArrayBuffer | Uint8Array;
  /** Initial scale (default: 1.5) */
  initialScale?: number;
  /** Show all pages or single page mode */
  mode?: 'all' | 'single';
  /** Show diagnostics panel */
  showDiagnostics?: boolean;
  /** Start with fit-to-width enabled */
  initialFitToWidth?: boolean;
  /** Show thumbnail sidebar (default: true for multi-page PDFs) */
  showThumbnails?: boolean;
  /** Callback when PDF loads successfully */
  onLoad?: (numPages: number) => void;
  /** Callback when PDF fails to load */
  onError?: (error: Error) => void;
}

interface PageState {
  pageNum: number;
  rendered: boolean;
}

interface DiagnosticsInfo {
  version: string;
  workerSrc: string;
  disableWorker: boolean;
  lastError: string | null;
}

export function PdfJsViewer({
  data,
  initialScale = 1.5,
  mode = 'all',
  showDiagnostics = false,
  initialFitToWidth = false,
  showThumbnails = true,
  onLoad,
  onError,
}: PdfJsViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [fitToWidth, setFitToWidth] = useState(initialFitToWidth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);
  const [thumbnailRotationMode, setThumbnailRotationMode] = useState<ThumbnailRotationMode>('auto');
  const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo>({
    version: pdfjsLib.version,
    workerSrc: '',
    disableWorker: false,
    lastError: null,
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const basePageWidth = useRef<number>(0);

  // Load PDF document with worker fallback
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);

      // Attempt 1: Try with local worker
      const tryLoadWithWorker = async (): Promise<pdfjsLib.PDFDocumentProxy> => {
        // Set worker right before getDocument call
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
        
        setDiagnostics(prev => ({
          ...prev,
          workerSrc: pdfjsWorkerUrl,
          disableWorker: false,
        }));

        const loadingTask = pdfjsLib.getDocument({ data });
        return loadingTask.promise;
      };

      // Attempt 2: Fallback without worker (main thread)
      const tryLoadWithoutWorker = async (): Promise<pdfjsLib.PDFDocumentProxy> => {
        console.warn('PDF.js: Falling back to main thread (no worker)');
        
        // Disable worker by setting empty workerSrc
        // PDF.js will run in main thread when workerSrc is empty/falsy
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        
        setDiagnostics(prev => ({
          ...prev,
          workerSrc: '(disabled)',
          disableWorker: true,
        }));

        const loadingTask = pdfjsLib.getDocument({ data });
        return loadingTask.promise;
      };

      try {
        let pdf: pdfjsLib.PDFDocumentProxy;

        try {
          // First attempt: with worker
          pdf = await tryLoadWithWorker();
        } catch (workerError) {
          // Check if it's a worker-related error
          const errorMsg = workerError instanceof Error ? workerError.message : String(workerError);
          const isWorkerError = 
            errorMsg.includes('Setting up fake worker failed') ||
            errorMsg.includes('Failed to fetch dynamically imported module') ||
            errorMsg.includes('worker') ||
            errorMsg.includes('Worker');

          setDiagnostics(prev => ({
            ...prev,
            lastError: errorMsg,
          }));

          if (isWorkerError) {
            console.warn('PDF.js worker error, retrying without worker:', errorMsg);
            // Retry without worker
            pdf = await tryLoadWithoutWorker();
          } else {
            // Not a worker error, rethrow
            throw workerError;
          }
        }

        if (cancelled) return;

        // Store the base page width (at scale 1) for fit-to-width calculations
        const firstPage = await pdf.getPage(1);
        const baseViewport = firstPage.getViewport({ scale: 1 });
        basePageWidth.current = baseViewport.width;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPages(
          Array.from({ length: pdf.numPages }, (_, i) => ({
            pageNum: i + 1,
            rendered: false,
          }))
        );
        onLoad?.(pdf.numPages);
      } catch (err) {
        if (cancelled) return;
        const errorMsg = err instanceof Error ? err.message : 'Failed to load PDF';
        setError(errorMsg);
        setDiagnostics(prev => ({
          ...prev,
          lastError: errorMsg,
        }));
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [data, onLoad, onError]);

  // Calculate fit-to-width scale
  const calculateFitToWidthScale = useCallback(() => {
    if (!scrollContainerRef.current || basePageWidth.current === 0) return null;
    
    // Get container width minus padding (32px = 16px * 2 for p-4)
    const containerWidth = scrollContainerRef.current.clientWidth - 32;
    const newScale = containerWidth / basePageWidth.current;
    
    // Clamp between 0.5 and 3
    return Math.max(0.5, Math.min(3, newScale));
  }, []);

  // Handle fit-to-width mode
  useEffect(() => {
    if (!fitToWidth || !pdfDoc) return;

    const updateScale = () => {
      const newScale = calculateFitToWidthScale();
      if (newScale !== null) {
        setScale(newScale);
      }
    };

    // Initial calculation
    updateScale();

    // Listen for container resize
    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [fitToWidth, pdfDoc, calculateFitToWidthScale]);

  // Render a single page to canvas with high-DPI support
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc) return;

      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        
        // Account for device pixel ratio for crisp rendering on Retina displays
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Create viewport at the desired CSS scale (let PDF.js apply page rotation)
        const viewport = page.getViewport({ scale });

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas buffer size to physical pixels (scaled by DPR)
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        
        // Set CSS size to maintain visual dimensions
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        
        // Reset context before render to avoid accumulated transforms
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Use transform param instead of context.scale() to avoid flip/mirror issues
        await page.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined,
        }).promise;

        setPages((prev) =>
          prev.map((p) =>
            p.pageNum === pageNum ? { ...p, rendered: true } : p
          )
        );
      } catch (err) {
        console.error(`Failed to render page ${pageNum}:`, err);
      }
    },
    [pdfDoc, scale]
  );

  // Render pages when PDF is loaded or scale changes
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    if (mode === 'all') {
      // Render all pages
      for (let i = 1; i <= numPages; i++) {
        renderPage(i);
      }
    } else {
      // Render only current page
      renderPage(currentPage);
    }
  }, [pdfDoc, numPages, scale, mode, currentPage, renderPage]);

  // Zoom controls - disable fit-to-width when manually zooming
  const zoomIn = () => {
    setFitToWidth(false);
    setScale((s) => Math.min(s + 0.25, 3));
  };
  const zoomOut = () => {
    setFitToWidth(false);
    setScale((s) => Math.max(s - 0.25, 0.5));
  };

  // Toggle fit-to-width mode
  const toggleFitToWidth = () => {
    setFitToWidth((prev) => !prev);
  };

  // Page navigation (single page mode)
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, numPages));

  // Navigate to a specific page (for thumbnail clicks)
  const goToPage = useCallback((pageNum: number) => {
    if (mode === 'single') {
      setCurrentPage(pageNum);
    } else {
      // In 'all' mode, scroll to the page
      const pageContainer = pageContainerRefs.current.get(pageNum);
      if (pageContainer) {
        pageContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setCurrentPage(pageNum);
  }, [mode]);

  // Register canvas ref
  const setCanvasRef = (pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(pageNum, el);
    } else {
      canvasRefs.current.delete(pageNum);
    }
  };

  // Register page container ref
  const setPageContainerRef = (pageNum: number) => (el: HTMLDivElement | null) => {
    if (el) {
      pageContainerRefs.current.set(pageNum, el);
    } else {
      pageContainerRefs.current.delete(pageNum);
    }
  };

  // Track current page based on scroll position in 'all' mode
  useEffect(() => {
    if (mode !== 'all' || !scrollContainerRef.current) return;

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const viewCenter = containerTop + containerHeight / 3;

      // Find which page is most visible
      let closestPage = 1;
      let closestDistance = Infinity;

      pageContainerRefs.current.forEach((el, pageNum) => {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const pageTop = rect.top - containerRect.top + containerTop;
        const pageCenter = pageTop + rect.height / 2;
        const distance = Math.abs(pageCenter - viewCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      });

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
      }
    };

    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [mode, currentPage]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loading02 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-destructive">
          <p className="text-sm font-medium">Failed to load PDF</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          {showDiagnostics && (
            <div className="mt-4 p-3 bg-muted rounded-md text-left text-xs font-mono">
              <p><span className="text-muted-foreground">Version:</span> {diagnostics.version}</p>
              <p><span className="text-muted-foreground">Worker:</span> {diagnostics.workerSrc || '(none)'}</p>
              <p><span className="text-muted-foreground">Disabled:</span> {diagnostics.disableWorker ? 'Yes' : 'No'}</p>
              {diagnostics.lastError && (
                <p className="mt-2 text-destructive break-all"><span className="text-muted-foreground">Error:</span> {diagnostics.lastError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-w-0 flex-col min-h-0 overflow-hidden">
      {/* Diagnostics Panel */}
      {showDiagnostics && (
        <div className="p-2 bg-muted/50 border-b border-border text-xs font-mono flex flex-wrap gap-x-4 gap-y-1">
          <span><span className="text-muted-foreground">v:</span> {diagnostics.version}</span>
          <span><span className="text-muted-foreground">worker:</span> {diagnostics.disableWorker ? 'disabled (main thread)' : 'enabled'}</span>
          {diagnostics.lastError && (
            <span className="text-amber-600"><span className="text-muted-foreground">warn:</span> recovered from worker error</span>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Thumbnail toggle */}
          {showThumbnails && numPages > 1 && (
            <>
              <Button
                variant={thumbnailsOpen ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setThumbnailsOpen((prev) => !prev)}
                className="h-7 w-7 p-0"
                aria-label={thumbnailsOpen ? 'Hide page thumbnails' : 'Show page thumbnails'}
                aria-pressed={thumbnailsOpen}
              >
                <LayoutLeft size={16} />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              {/* Rotation mode dropdown - only show when thumbnails are open */}
              {thumbnailsOpen && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      aria-label="Thumbnail rotation mode"
                    >
                      <RefreshCcw01 size={14} />
                      <span className="hidden sm:inline capitalize">{thumbnailRotationMode}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                      value={thumbnailRotationMode}
                      onValueChange={(value) => setThumbnailRotationMode(value as ThumbnailRotationMode)}
                    >
                      <DropdownMenuRadioItem value="auto">Auto</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="respect">Respect PDF rotation</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="ignore">Ignore PDF rotation</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-7 w-7 p-0"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="h-7 w-7 p-0"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant={fitToWidth ? 'secondary' : 'ghost'}
            size="sm"
            onClick={toggleFitToWidth}
            className="h-7 px-2 text-xs gap-1"
            aria-label="Fit to width"
            aria-pressed={fitToWidth}
          >
            <Expand01 size={14} />
            <span className="hidden sm:inline">Fit</span>
          </Button>
        </div>

        {mode === 'single' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="h-7 w-7 p-0"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentPage} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              className="h-7 w-7 p-0"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {mode === 'all' && (
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {numPages}
          </span>
        )}
      </div>

      {/* Main content area with optional thumbnail sidebar */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {/* Thumbnail Sidebar */}
        {showThumbnails && numPages > 1 && (
          <PdfThumbnailSidebar
            pdfDoc={pdfDoc}
            numPages={numPages}
            currentPage={currentPage}
            onPageClick={goToPage}
            isOpen={thumbnailsOpen}
            onToggle={() => setThumbnailsOpen((prev) => !prev)}
            rotationMode={thumbnailRotationMode}
          />
        )}

        {/* PDF Pages */}
        <div ref={scrollContainerRef} className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          <div
            ref={containerRef}
            className="flex flex-col items-center gap-4 p-4 bg-muted/30"
          >
            {mode === 'all' ? (
              // Render all pages
              pages.map(({ pageNum }) => (
                <div
                  key={pageNum}
                  ref={setPageContainerRef(pageNum)}
                  className="shadow-lg bg-white"
                  style={{ lineHeight: 0 }}
                >
                  <canvas
                    ref={setCanvasRef(pageNum)}
                    className="block"
                    aria-label={`Page ${pageNum}`}
                  />
                </div>
              ))
            ) : (
              // Render single page
              <div className="shadow-lg bg-white" style={{ lineHeight: 0 }}>
                <canvas
                  ref={setCanvasRef(currentPage)}
                  className="block"
                  aria-label={`Page ${currentPage}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfJsViewer;
