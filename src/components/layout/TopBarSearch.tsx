/**
 * @fileoverview Reusable TopBar Search Component
 * 
 * A search input with popover dropdown for live results.
 * Used across multiple pages (Inbox, Knowledge Base, etc.).
 * 
 * @module components/layout/TopBarSearch
 */

import React, { useState, useRef, useCallback, type ReactNode } from 'react';
import { SearchMd, XClose } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TopBarSearchProps {
  /** Placeholder text for the input */
  placeholder?: string;
  /** Current search query (controlled) */
  value: string;
  /** Callback when search query changes */
  onChange: (query: string) => void;
  /** Render function for results - receives the query and returns JSX */
  renderResults?: (query: string) => ReactNode;
  /** Optional: Close dropdown when item is selected */
  onResultSelect?: () => void;
  /** Width class for the search input container */
  className?: string;
  /** Whether to show the popover (default: true when value is non-empty) */
  showPopover?: boolean;
}

/**
 * Reusable search component for TopBar with live results dropdown.
 * Uses Popover for inline dropdown that opens on focus.
 */
export function TopBarSearch({
  placeholder = 'Search...',
  value,
  onChange,
  renderResults,
  onResultSelect,
  className,
  showPopover = true,
}: TopBarSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onChange('');
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value && !isOpen) {
      setIsOpen(true);
    }
  }, [onChange, isOpen]);

  const handleFocus = useCallback(() => {
    if (value) {
      setIsOpen(true);
    }
  }, [value]);

  // Internal handler for result selection
  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    onChange('');
    onResultSelect?.();
  }, [onChange, onResultSelect]);

  const shouldShowPopover = showPopover && isOpen && value.length > 0 && !!renderResults;

  return (
    <Popover open={shouldShowPopover} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative w-48 lg:w-64", className)}>
          <SearchMd 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" 
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-8"
            size="sm"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <XClose size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      
      {renderResults && (
        <PopoverContent 
          align="start" 
          sideOffset={8}
          className="w-[320px] p-0 max-h-80 overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <TopBarSearchResultsContext.Provider value={{ onResultClick: handleResultClick }}>
            {renderResults(value)}
          </TopBarSearchResultsContext.Provider>
        </PopoverContent>
      )}
    </Popover>
  );
}

// Context for passing result click handler to child result items
interface TopBarSearchResultsContextType {
  onResultClick: () => void;
}

const TopBarSearchResultsContext = React.createContext<TopBarSearchResultsContextType | null>(null);

export function useTopBarSearchResults() {
  return React.useContext(TopBarSearchResultsContext);
}
