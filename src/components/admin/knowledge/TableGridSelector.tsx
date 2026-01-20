/**
 * Table Grid Selector
 * 
 * Interactive grid for selecting table dimensions.
 * Hover to select size, click to insert.
 * 
 * @see docs/ARTICLE_EDITOR.md
 * @module components/admin/knowledge/TableGridSelector
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TableGridSelectorProps {
  onSelect: (rows: number, cols: number) => void;
  maxRows?: number;
  maxCols?: number;
}

/**
 * Interactive grid selector for table dimensions.
 * Similar to Word/Google Docs table insertion.
 */
export function TableGridSelector({
  onSelect,
  maxRows = 6,
  maxCols = 8,
}: TableGridSelectorProps) {
  const [hoveredRows, setHoveredRows] = useState(0);
  const [hoveredCols, setHoveredCols] = useState(0);

  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredRows(row);
    setHoveredCols(col);
  }, []);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      onSelect(row, col);
    },
    [onSelect]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredRows(0);
    setHoveredCols(0);
  }, []);

  return (
    <div className="flex flex-col gap-2" onMouseLeave={handleMouseLeave}>
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, 1rem)`,
        }}
      >
        {Array.from({ length: maxRows }).map((_, rowIndex) =>
          Array.from({ length: maxCols }).map((_, colIndex) => {
            const row = rowIndex + 1;
            const col = colIndex + 1;
            const isHighlighted = row <= hoveredRows && col <= hoveredCols;

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onMouseEnter={() => handleCellHover(row, col)}
                onClick={() => handleCellClick(row, col)}
                className={cn(
                  'w-4 h-4 rounded-sm border transition-colors',
                  isHighlighted
                    ? 'bg-primary/20 border-primary/50'
                    : 'bg-muted/30 border-border hover:border-primary/30'
                )}
                aria-label={`Insert ${row}×${col} table`}
              />
            );
          })
        )}
      </div>
      
      {/* Dimension label */}
      <div className="text-center text-2xs text-muted-foreground">
        {hoveredRows > 0 && hoveredCols > 0 ? (
          <span>{hoveredRows} × {hoveredCols}</span>
        ) : (
          <span>Select size</span>
        )}
      </div>
    </div>
  );
}
